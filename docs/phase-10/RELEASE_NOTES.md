# Release Notes — Phase 10 preparation

## Added

- Final RC 派生的学生答辩卡、slide material、practice question 和 rehearsal domain types。
- 可验证 archive manifest：logical ID、相对路径、大小、SHA-256、来源和版本。
- zip-slip、绝对路径、敏感文件、重复路径与篡改内容拒绝。
- recovery report 与已知限制/发布边界文档。
- 修复规则候选跨文件语义去重，避免同一条规则重复显示。
- 修复写作页/定稿页加载失败时无限转圈，保留原生错误原因。
- 修复文件与项目删除的事务顺序、外键清理和磁盘/数据库一致性；加入删除回归测试。
- 重新生成 Windows x64 MSI/NSIS Release 产物，并完成桌面启动冒烟测试。

## Not released as V1.0

由于干净 Windows 安装/升级/卸载、真实全旅程及桌面性能手工 Gate 尚未全部完成，本次不创建 `v1.0` tag。
