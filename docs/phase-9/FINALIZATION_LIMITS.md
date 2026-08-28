# Phase 9 Finalization Limits

Phase 9 的“通过”只表示检查器能够证明的事实，不等同于学校最终接收或论文质量评分。

- Word/WPS 的复杂域、特殊学校模板、目录刷新、页码字段、分页美观仍是 `UNSUPPORTED` 或 `REVIEW`，必须由学生在真实导出文件中确认。
- 外部 DOI/URL 真实性没有联网 lookup 时不会标记 PASS；系统不会凭空补 DOI、页码、作者或统计数字。
- 逻辑一致性、研究意义、结论是否过度外推属于启发式建议，只能生成 REVIEW，不会冒充 machine FAIL。
- Phase 9 RC 的导出 manifest 需要已有 Phase 8 导出记录；页面不会伪造“导出成功”。
- RC 快照在当前前端路径使用项目隔离的 localStorage 持久化；生产桌面版仍应将 RC、Issue、人工确认和 manifest 下沉到 SQLite migration，以支持跨设备备份与数据库级恢复。
- Phase 9 不包含教师账号、导师审批、教师批注或签字流程。
