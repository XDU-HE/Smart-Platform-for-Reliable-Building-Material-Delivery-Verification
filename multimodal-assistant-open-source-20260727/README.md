# 建筑材料可信交付智能核验平台

这是经过敏感信息清理的开源发布副本，包含材料交付前端、真实多模态识别网关，以及根目录中的 Vite 演示项目。

## 项目结构

- `material-delivery-web/`：Vue 3 + TypeScript 前端，包含材料档案、运输轨迹、到场核验和风险结论等界面。
- `material-recognition-gateway/`：Spring Boot 多模态识别网关，通过后端调用 OpenAI 兼容的视觉模型。
- `src/`、`public/`：根目录中的轻量 Vite 演示项目。

## 本地配置

前端：

```powershell
cd material-delivery-web
Copy-Item .env.example .env.development
npm install
npm run dev
```

按 `.env.example` 填写本地值。高德 Web Key 和安全密钥应配置域名白名单或服务端代理，不要提交真实 `.env` 文件。

识别网关：

```powershell
cd material-recognition-gateway
Copy-Item config/application-local.example.yml config/application-local.yml
mvn spring-boot:run
```

在 `config/application-local.yml` 中填写模型 Base URL、API Key 和模型名。该文件已被 `.gitignore` 排除，模型密钥不得放入前端代码。

## 构建与测试

```powershell
# 根目录演示
npm install
npm run build

# 主前端
cd material-delivery-web
npm install
npm run build

# 后端
cd ..\material-recognition-gateway
mvn test
```

## 发布前须知

- 本发布副本不包含真实本地配置、依赖目录、构建产物、IDE 文件或 Word 截图文档。
- 演示图片和质量证明书 PDF 标注为模拟样本，不代表真实企业或交易。
- 当前项目未附开源许可证。正式公开前，请由代码权利人选择并添加合适的 `LICENSE`。
- 敏感信息检查结果见 `OPEN_SOURCE_AUDIT.md`。
