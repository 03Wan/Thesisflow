use keyring::Entry;

const SERVICE: &str = "ThesisFlow.AI";

pub trait SecretStore: Send + Sync {
    fn save_secret(&self, secret_ref: &str, value: &str) -> Result<(), String>;
    fn get_secret(&self, secret_ref: &str) -> Result<String, String>;
    fn delete_secret(&self, secret_ref: &str) -> Result<(), String>;
    fn has_secret(&self, secret_ref: &str) -> Result<bool, String>;
}

pub struct WindowsCredentialSecretStore;

impl WindowsCredentialSecretStore {
    fn entry(secret_ref: &str) -> Result<Entry, String> {
        if secret_ref.is_empty()
            || secret_ref.len() > 200
            || !secret_ref
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.' | '/'))
        {
            return Err("密钥引用格式无效。".to_owned());
        }
        Entry::new(SERVICE, secret_ref).map_err(|error| format!("安全凭据存储不可用：{error}"))
    }
}

impl SecretStore for WindowsCredentialSecretStore {
    fn save_secret(&self, secret_ref: &str, value: &str) -> Result<(), String> {
        if value.trim().is_empty() {
            return Err("密钥不能为空。".to_owned());
        }
        Self::entry(secret_ref)?
            .set_password(value)
            .map_err(|error| format!("无法保存到 Windows 凭据管理器：{error}"))
    }

    fn get_secret(&self, secret_ref: &str) -> Result<String, String> {
        Self::entry(secret_ref)?
            .get_password()
            .map_err(|error| format!("无法从 Windows 凭据管理器读取密钥：{error}"))
    }

    fn delete_secret(&self, secret_ref: &str) -> Result<(), String> {
        match Self::entry(secret_ref)?.delete_credential() {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(format!("无法从 Windows 凭据管理器删除密钥：{error}")),
        }
    }

    fn has_secret(&self, secret_ref: &str) -> Result<bool, String> {
        match Self::entry(secret_ref)?.get_password() {
            Ok(_) => Ok(true),
            Err(keyring::Error::NoEntry) => Ok(false),
            Err(error) => Err(format!("无法检查 Windows 凭据管理器：{error}")),
        }
    }
}

#[cfg(test)]
pub struct FakeSecretStore(std::sync::Mutex<std::collections::HashMap<String, String>>);

#[cfg(test)]
impl FakeSecretStore {
    pub fn new() -> Self {
        Self(std::sync::Mutex::new(std::collections::HashMap::new()))
    }
}

#[cfg(test)]
impl SecretStore for FakeSecretStore {
    fn save_secret(&self, secret_ref: &str, value: &str) -> Result<(), String> {
        self.0
            .lock()
            .unwrap()
            .insert(secret_ref.to_owned(), value.to_owned());
        Ok(())
    }
    fn get_secret(&self, secret_ref: &str) -> Result<String, String> {
        self.0
            .lock()
            .unwrap()
            .get(secret_ref)
            .cloned()
            .ok_or_else(|| "missing".to_owned())
    }
    fn delete_secret(&self, secret_ref: &str) -> Result<(), String> {
        self.0.lock().unwrap().remove(secret_ref);
        Ok(())
    }
    fn has_secret(&self, secret_ref: &str) -> Result<bool, String> {
        Ok(self.0.lock().unwrap().contains_key(secret_ref))
    }
}
