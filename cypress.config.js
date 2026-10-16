import {defineConfig} from "cypress";
export default defineConfig({video:false,e2e:{baseUrl:process.env.DEPLOY_URL||"http://127.0.0.1:8792",specPattern:"cypress/integration/**/*.js",supportFile:false}});
