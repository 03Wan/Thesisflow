# Known Limitations

- 当前产品版本仍为 `0.2.0`，本阶段没有伪造 `v1.0` 发布标签。
- 答辩卡、幻灯片素材、练习题与归档校验已有 domain service 和自动化测试；现有旧答辩页面尚未全部迁移到该真实数据源，因此 UI 端标记 limited。
- 当前没有宣称真实 PPTX exporter、录音转写、评委预测或教师/导师工作流。
- archive restore 的包级拒绝/完整性校验已覆盖；隔离桌面数据库销毁恢复、旧安装包升级和干净 Windows VM 仍需手工执行。
- AI provider 的发送边界、富文本危险 URL、磁盘满和异常退出需要目标桌面环境复验。
- 未配置代码签名；发布物必须显示 warning。
