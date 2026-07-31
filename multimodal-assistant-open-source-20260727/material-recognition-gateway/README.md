# Material Recognition Gateway

v0.6 多模态识别网关。服务只负责接收出厂或到场凭证、将 PDF 转为图片并调用 OpenAI 兼容的视觉模型，不保存业务数据或原始文件。

## 本地启动

1. 复制 `config/application-local.example.yml` 为 `config/application-local.yml`。
2. 填写百炼工作空间 Base URL、API Key 和模型名。
3. 在当前目录执行 `mvn spring-boot:run`。
4. 访问 `GET http://localhost:8081/api/recognition/health` 查看配置状态。

真实识别接口：

- `POST /api/recognition/factory`：multipart 字段 `certificate`、`nameplate`
- `POST /api/recognition/arrival`：multipart 字段 `nameplate`

单文件上限 10 MB；质量证明书支持 PDF、JPEG、PNG、WEBP，铭牌支持 JPEG、PNG、WEBP。
