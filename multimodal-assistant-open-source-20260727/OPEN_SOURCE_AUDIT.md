# 开源发布敏感信息检查

检查日期：2026-07-27（Asia/Shanghai）

## 已移除

- `material-delivery-web/.env.development`：包含 2 个已设置的高德相关本地值。
- `material-recognition-gateway/config/application-local.yml`：包含 1 个已设置的模型 API Key。
- 所有 `.docx`：其中一个文件名明确包含“真实项目截图”，且 Word 文件可能携带作者元数据或隐藏内容。
- `.git`、`.agents`、`.codex`、`.idea`、`.docx-build`、`.superdesign`、`node_modules`、`dist`、`target`、缓存、日志和 IDE 工程文件。

## 已保留

- `material-delivery-web/.env.example`。
- `material-recognition-gateway/config/application-local.example.yml`。
- 明确标注为模拟数据的演示图片和质量证明书 PDF。
- 源码、Markdown 文档、依赖锁文件和构建配置。

## 检查结论

- 三个真实凭据值在原目录中均只出现于各自的本地配置文件，没有复制到源码、Markdown 文档或锁文件。
- 演示 PNG 不含 EXIF/GPS 元数据。
- 示例 PDF 无脚本、表单或加密，并在页面中明确标注为模拟样本。
- 发布副本已强化 `.gitignore`，用于阻止常见环境文件、私钥和本地配置被误提交。

## 限制与发布建议

- 原目录的 `.git` 是空目录，因此本次无法扫描历史提交。此发布副本应作为新的干净仓库初始化。
- 若这些凭据曾经上传到其他 Git 仓库、网盘、聊天或构建日志，请在发布前到对应平台轮换/撤销；仅从当前目录删除并不能使已经泄露的密钥失效。
- 正式公开前仍应由项目负责人确认图片、字体、依赖和业务文档的版权，并添加开源许可证。
