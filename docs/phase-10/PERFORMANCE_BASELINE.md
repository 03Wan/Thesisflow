# Performance Baseline

本次自动化验收记录的是可重复的服务级基线，不伪造桌面毫秒指标：Phase 10 service tests（3 tests）在本机完成，JSZip manifest verification 为同步单包小文件路径。真实论文、大文献库、大数据集、长列表、搜索、导出、启动与内存/CPU 长任务仍需在目标 Windows 机器采集。

## Required measurements before release

记录机器、数据规模、冷/热启动、导入、搜索、分析、DOCX/archive export、峰值内存和 UI responsiveness；每项保留命令/数据规模/结果/阈值。若超过产品阈值，标为 REVIEW 或修复，不用“正常”替代数值。

Current status: automated blocker = 0; desktop performance gate = REVIEW/pending measurement.
