// vite.config.ts
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as process from "node:process";
import { loadEnv } from "file:///E:/jfwl/18gps/node_modules/vite/dist/node/index.js";

// plugins/index.ts
import vue from "file:///E:/jfwl/18gps/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///E:/jfwl/18gps/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import AutoImport from "file:///E:/jfwl/18gps/node_modules/unplugin-auto-import/dist/vite.js";
import GenerateConfig from "file:///E:/jfwl/18gps/node_modules/unplugin-config/dist/vite.js";
import Components from "file:///E:/jfwl/18gps/node_modules/unplugin-vue-components/dist/vite.js";
import VitePluginPreloadAll from "file:///E:/jfwl/18gps/node_modules/@mistjs/vite-plugin-preload/dist/index.mjs";
import Unocss from "file:///E:/jfwl/18gps/node_modules/unocss/dist/vite.mjs";
import AntdvResolver from "file:///E:/jfwl/18gps/node_modules/antdv-component-resolver/dist/index.mjs";

// plugins/constants.ts
var GLOB_CONFIG_FILE_NAME = "_app.config.js";
var OUTPUT_DIR = "dist";

// plugins/vite-build-info.ts
import { readdir, stat } from "node:fs";
import dayjs from "file:///E:/jfwl/18gps/node_modules/dayjs/dayjs.min.js";
import duration from "file:///E:/jfwl/18gps/node_modules/dayjs/plugin/duration.js";
import pkg from "file:///E:/jfwl/18gps/node_modules/picocolors/picocolors.js";
var { green, blue, bold } = pkg;
dayjs.extend(duration);
var fileListTotal = [];
function recursiveDirectory(folder, callback) {
  readdir(folder, (err, files) => {
    if (err)
      throw err;
    let count = 0;
    const checkEnd = () => {
      ++count === files.length && callback();
    };
    files.forEach((item) => {
      stat(`${folder}/${item}`, async (err2, stats) => {
        if (err2)
          throw err2;
        if (stats.isFile()) {
          fileListTotal.push(stats.size);
          checkEnd();
        } else if (stats.isDirectory()) {
          recursiveDirectory(`${folder}/${item}/`, checkEnd);
        }
      });
    });
    files.length === 0 && callback();
  });
}
function sum(arr) {
  return arr.reduce((t, c) => {
    return t + c;
  }, 0);
}
function formatBytes(a, b) {
  if (a === 0)
    return "0 Bytes";
  const c = 1024;
  const d = b || 2;
  const e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const f = Math.floor(Math.log(a) / Math.log(c));
  return `${Number.parseFloat((a / c ** f).toFixed(d))} ${e[f]}`;
}
function viteBuildInfo(name) {
  let config;
  let startTime;
  let endTime;
  return {
    name: "vite:buildInfo",
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    buildStart() {
      console.log(
        bold(
          green(
            `\u{1F44F}\u6B22\u8FCE\u4F7F\u7528${blue(`[${name}]`)}\uFF0C\u73B0\u5728\u6B63\u5168\u529B\u4E3A\u60A8${config.command === "build" ? "\u6253\u5305" : "\u7F16\u8BD1"}`
          )
        )
      );
      if (config.command === "build")
        startTime = dayjs(/* @__PURE__ */ new Date());
    },
    closeBundle() {
      if (config.command === "build") {
        endTime = dayjs(/* @__PURE__ */ new Date());
        recursiveDirectory(config.build.outDir, () => {
          console.log(
            bold(
              green(
                `\u606D\u559C\u6253\u5305\u5B8C\u6210\u{1F389}\uFF08\u603B\u7528\u65F6${dayjs.duration(endTime.diff(startTime)).format("mm\u5206ss\u79D2")}\uFF0C\u6253\u5305\u540E\u7684\u5927\u5C0F\u4E3A${formatBytes(
                  sum(fileListTotal)
                )}\uFF09`
              )
            )
          );
        });
      }
    }
  };
}

// plugins/index.ts
function createVitePlugins(env) {
  const vitePluginList = [
    vue(),
    vueJsx(),
    VitePluginPreloadAll(),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "vue-i18n",
        "@vueuse/core",
        "pinia"
      ],
      dts: "types/auto-imports.d.ts",
      dirs: ["src/stores", "src/composables"]
    }),
    Components({
      resolvers: [AntdvResolver()],
      dts: "types/components.d.ts",
      dirs: ["src/components"]
    }),
    // https://github.com/kirklin/unplugin-config
    GenerateConfig({
      baseDir: "./",
      appName: env.VITE_GLOB_APP_TITLE,
      configFile: {
        generate: true,
        fileName: GLOB_CONFIG_FILE_NAME,
        outputDir: OUTPUT_DIR
      },
      envVariables: {
        prefix: "VITE_GLOB_"
      }
    }),
    Unocss(),
    viteBuildInfo(env.VITE_APP_NAME)
  ];
  return vitePluginList;
}

// plugins/svgBuilder.js
import { readFileSync, readdirSync } from "node:fs";
var idPerfix = "";
var svgTitle = /<svg([^>+].*?)>/;
var clearHeightWidth = /(width|height)="([^>+].*?)"/g;
var hasViewBox = /(viewBox="[^>+].*?")/g;
var clearReturn = /(\r)|(\n)/g;
function findSvgFile(dir) {
  const svgRes = [];
  const dirents = readdirSync(dir, {
    withFileTypes: true
  });
  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      svgRes.push(...findSvgFile(`${dir + dirent.name}/`));
    } else {
      const svg = readFileSync(dir + dirent.name).toString().replace(clearReturn, "").replace(svgTitle, ($1, $2) => {
        let width = 0;
        let height = 0;
        let content = $2.replace(clearHeightWidth, (s1, s2, s3) => {
          if (s2 === "width") {
            width = s3;
          } else if (s2 === "height") {
            height = s3;
          }
          return "";
        });
        if (!hasViewBox.test($2)) {
          content += `viewBox="0 0 ${width} ${height}"`;
        }
        return `<symbol id="${idPerfix}-${dirent.name.replace(".svg", "")}" ${content}>`;
      }).replace("</svg>", "</symbol>");
      svgRes.push(svg);
    }
  }
  return svgRes;
}
function svgBuilder(path, perfix = "icon") {
  if (path === "")
    return;
  idPerfix = perfix;
  const res = findSvgFile(path);
  return {
    name: "svg-transform",
    transformIndexHtml(html) {
      return html.replace(
        "<body>",
        `
          <body>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="position: absolute; width: 0; height: 0">
              ${res.join("")}
            </svg>
        `
      );
    }
  };
}

// vite.config.ts
var __vite_injected_original_import_meta_url = "file:///E:/jfwl/18gps/vite.config.ts";
var baseSrc = fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url));
var vite_config_default = ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const proxyObj = {};
  if (mode === "development" && env.VITE_APP_BASE_API_DEV && env.VITE_APP_BASE_URL_DEV) {
    proxyObj[env.VITE_APP_BASE_API_DEV] = {
      target: env.VITE_APP_BASE_URL_DEV,
      secure: false,
      changeOrigin: true,
      rewrite: (path) => path.replace(new RegExp(`^${env.VITE_APP_BASE_API_DEV}`), "")
    };
  }
  return {
    base: "./",
    plugins: [svgBuilder("./src/assets/svg/"), ...createVitePlugins(env)],
    resolve: {
      alias: [
        {
          find: "dayjs",
          replacement: "dayjs/esm"
        },
        {
          find: /^dayjs\/locale/,
          replacement: "dayjs/esm/locale"
        },
        {
          find: /^dayjs\/plugin/,
          replacement: "dayjs/esm/plugin"
        },
        {
          find: "vue-i18n",
          replacement: mode === "development" ? "vue-i18n/dist/vue-i18n.esm-browser.js" : "vue-i18n/dist/vue-i18n.esm-bundler.js"
        },
        {
          find: /^ant-design-vue\/es$/,
          replacement: "ant-design-vue/es"
        },
        {
          find: /^ant-design-vue\/dist$/,
          replacement: "ant-design-vue/dist"
        },
        {
          find: /^ant-design-vue\/lib$/,
          replacement: "ant-design-vue/es"
        },
        {
          find: /^ant-design-vue$/,
          replacement: "ant-design-vue/es"
        },
        {
          find: "lodash",
          replacement: "lodash-es"
        },
        {
          find: "~@",
          replacement: baseSrc
        },
        {
          find: "~",
          replacement: baseSrc
        },
        {
          find: "@",
          replacement: baseSrc
        },
        {
          find: "~#",
          replacement: resolve(baseSrc, "./enums")
        }
      ]
    },
    build: {
      chunkSizeWarningLimit: 4096,
      outDir: OUTPUT_DIR,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ["vue", "vue-router", "pinia", "vue-i18n", "@vueuse/core"],
            antd: ["ant-design-vue", "@ant-design/icons-vue", "dayjs"]
            // lodash: ['loadsh-es'],
          }
        }
      }
    },
    server: {
      port: 8002,
      proxy: {
        ...proxyObj
        // '/mngapi': {
        //   target: env.VITE_APP_BASE_URL,
        // //   如果你是https接口，需要配置这个参数
        // //   secure: false,
        //   changeOrigin: true,
        //   rewrite: path => path.replace(new RegExp(`^${env.VITE_APP_BASE_API}`), ''),
        // },
      }
    },
    test: {
      globals: true,
      environment: "jsdom"
    }
  };
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGx1Z2lucy9pbmRleC50cyIsICJwbHVnaW5zL2NvbnN0YW50cy50cyIsICJwbHVnaW5zL3ZpdGUtYnVpbGQtaW5mby50cyIsICJwbHVnaW5zL3N2Z0J1aWxkZXIuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9qZndsLzE4Z3BzL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJ1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXHJcbmltcG9ydCAqIGFzIHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJ1xyXG5pbXBvcnQgeyBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHR5cGUgeyBDb25maWdFbnYsIFVzZXJDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgeyBjcmVhdGVWaXRlUGx1Z2lucyB9IGZyb20gJy4vcGx1Z2lucydcclxuaW1wb3J0IHsgT1VUUFVUX0RJUiB9IGZyb20gJy4vcGx1Z2lucy9jb25zdGFudHMnXHJcbmltcG9ydCB7IHN2Z0J1aWxkZXIgfSBmcm9tICcuL3BsdWdpbnMvc3ZnQnVpbGRlci5qcydcclxuXHJcbmNvbnN0IGJhc2VTcmMgPSBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgKHsgbW9kZSB9OiBDb25maWdFbnYpOiBVc2VyQ29uZmlnID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCkpXHJcbiAgY29uc3QgcHJveHlPYmogPSB7fVxyXG4gIGlmIChtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGVudi5WSVRFX0FQUF9CQVNFX0FQSV9ERVYgJiYgZW52LlZJVEVfQVBQX0JBU0VfVVJMX0RFVikge1xyXG4gICAgcHJveHlPYmpbZW52LlZJVEVfQVBQX0JBU0VfQVBJX0RFVl0gPSB7XHJcbiAgICAgIHRhcmdldDogZW52LlZJVEVfQVBQX0JBU0VfVVJMX0RFVixcclxuICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICByZXdyaXRlOiBwYXRoID0+IHBhdGgucmVwbGFjZShuZXcgUmVnRXhwKGBeJHtlbnYuVklURV9BUFBfQkFTRV9BUElfREVWfWApLCAnJyksXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICBiYXNlOiAnLi8nLFxyXG4gICAgcGx1Z2luczogW3N2Z0J1aWxkZXIoJy4vc3JjL2Fzc2V0cy9zdmcvJyksIC4uLmNyZWF0ZVZpdGVQbHVnaW5zKGVudildLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZpbmQ6ICdkYXlqcycsXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2RheWpzL2VzbScsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXmRheWpzXFwvbG9jYWxlLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnZGF5anMvZXNtL2xvY2FsZScsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXmRheWpzXFwvcGx1Z2luLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnZGF5anMvZXNtL3BsdWdpbicsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAndnVlLWkxOG4nLFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyAndnVlLWkxOG4vZGlzdC92dWUtaTE4bi5lc20tYnJvd3Nlci5qcycgOiAndnVlLWkxOG4vZGlzdC92dWUtaTE4bi5lc20tYnVuZGxlci5qcycsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXmFudC1kZXNpZ24tdnVlXFwvZXMkLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnYW50LWRlc2lnbi12dWUvZXMnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogL15hbnQtZGVzaWduLXZ1ZVxcL2Rpc3QkLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnYW50LWRlc2lnbi12dWUvZGlzdCcsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXmFudC1kZXNpZ24tdnVlXFwvbGliJC8sXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2FudC1kZXNpZ24tdnVlL2VzJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZpbmQ6IC9eYW50LWRlc2lnbi12dWUkLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnYW50LWRlc2lnbi12dWUvZXMnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogJ2xvZGFzaCcsXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2xvZGFzaC1lcycsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAnfkAnLFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IGJhc2VTcmMsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAnficsXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogYmFzZVNyYyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZpbmQ6ICdAJyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiBiYXNlU3JjLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogJ34jJyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiByZXNvbHZlKGJhc2VTcmMsICcuL2VudW1zJyksXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDQwOTYsXHJcbiAgICAgIG91dERpcjogT1VUUFVUX0RJUixcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAgIHZ1ZTogWyd2dWUnLCAndnVlLXJvdXRlcicsICdwaW5pYScsICd2dWUtaTE4bicsICdAdnVldXNlL2NvcmUnXSxcclxuICAgICAgICAgICAgYW50ZDogWydhbnQtZGVzaWduLXZ1ZScsICdAYW50LWRlc2lnbi9pY29ucy12dWUnLCAnZGF5anMnXSxcclxuICAgICAgICAgICAgLy8gbG9kYXNoOiBbJ2xvYWRzaC1lcyddLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBwb3J0OiA4MDAyLFxyXG4gICAgICBwcm94eToge1xyXG4gICAgICAgIC4uLnByb3h5T2JqLFxyXG4gICAgICAgIC8vICcvbW5nYXBpJzoge1xyXG4gICAgICAgIC8vICAgdGFyZ2V0OiBlbnYuVklURV9BUFBfQkFTRV9VUkwsXHJcbiAgICAgICAgLy8gLy8gICBcdTU5ODJcdTY3OUNcdTRGNjBcdTY2MkZodHRwc1x1NjNBNVx1NTNFM1x1RkYwQ1x1OTcwMFx1ODk4MVx1OTE0RFx1N0Y2RVx1OEZEOVx1NEUyQVx1NTNDMlx1NjU3MFxyXG4gICAgICAgIC8vIC8vICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgICAvLyAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAvLyAgIHJld3JpdGU6IHBhdGggPT4gcGF0aC5yZXBsYWNlKG5ldyBSZWdFeHAoYF4ke2Vudi5WSVRFX0FQUF9CQVNFX0FQSX1gKSwgJycpLFxyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgdGVzdDoge1xyXG4gICAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcclxuICAgIH0sXHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcamZ3bFxcXFwxOGdwc1xcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXFxcXHBsdWdpbnNcXFxcaW5kZXgudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2pmd2wvMThncHMvcGx1Z2lucy9pbmRleC50c1wiO2ltcG9ydCB0eXBlIHsgUGx1Z2luT3B0aW9uIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCB2dWVKc3ggZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlLWpzeCdcclxuaW1wb3J0IEF1dG9JbXBvcnQgZnJvbSAndW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZSdcclxuaW1wb3J0IEdlbmVyYXRlQ29uZmlnIGZyb20gJ3VucGx1Z2luLWNvbmZpZy92aXRlJ1xyXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xyXG5pbXBvcnQgVml0ZVBsdWdpblByZWxvYWRBbGwgZnJvbSAnQG1pc3Rqcy92aXRlLXBsdWdpbi1wcmVsb2FkJ1xyXG5pbXBvcnQgVW5vY3NzIGZyb20gJ3Vub2Nzcy92aXRlJ1xyXG5pbXBvcnQgQW50ZHZSZXNvbHZlciBmcm9tICdhbnRkdi1jb21wb25lbnQtcmVzb2x2ZXInXHJcbmltcG9ydCB7IEdMT0JfQ09ORklHX0ZJTEVfTkFNRSwgT1VUUFVUX0RJUiB9IGZyb20gJy4vY29uc3RhbnRzJ1xyXG5pbXBvcnQgeyB2aXRlQnVpbGRJbmZvIH0gZnJvbSAnLi92aXRlLWJ1aWxkLWluZm8nXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVml0ZVBsdWdpbnMoZW52OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KSB7XHJcbiAgY29uc3Qgdml0ZVBsdWdpbkxpc3Q6IChQbHVnaW5PcHRpb24gfCBQbHVnaW5PcHRpb25bXSlbXSA9IFtcclxuICAgIHZ1ZSgpLFxyXG4gICAgdnVlSnN4KCksXHJcbiAgICBWaXRlUGx1Z2luUHJlbG9hZEFsbCgpLFxyXG4gICAgQXV0b0ltcG9ydCh7XHJcbiAgICAgIGltcG9ydHM6IFtcclxuICAgICAgICAndnVlJyxcclxuICAgICAgICAndnVlLXJvdXRlcicsXHJcbiAgICAgICAgJ3Z1ZS1pMThuJyxcclxuICAgICAgICAnQHZ1ZXVzZS9jb3JlJyxcclxuICAgICAgICAncGluaWEnLFxyXG4gICAgICBdLFxyXG4gICAgICBkdHM6ICd0eXBlcy9hdXRvLWltcG9ydHMuZC50cycsXHJcbiAgICAgIGRpcnM6IFsnc3JjL3N0b3JlcycsICdzcmMvY29tcG9zYWJsZXMnXSxcclxuICAgIH0pLFxyXG4gICAgQ29tcG9uZW50cyh7XHJcbiAgICAgIHJlc29sdmVyczogW0FudGR2UmVzb2x2ZXIoKV0sXHJcbiAgICAgIGR0czogJ3R5cGVzL2NvbXBvbmVudHMuZC50cycsXHJcbiAgICAgIGRpcnM6IFsnc3JjL2NvbXBvbmVudHMnXSxcclxuICAgIH0pLFxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2tpcmtsaW4vdW5wbHVnaW4tY29uZmlnXHJcbiAgICBHZW5lcmF0ZUNvbmZpZyh7XHJcbiAgICAgIGJhc2VEaXI6ICcuLycsXHJcbiAgICAgIGFwcE5hbWU6IGVudi5WSVRFX0dMT0JfQVBQX1RJVExFLFxyXG4gICAgICBjb25maWdGaWxlOiB7XHJcbiAgICAgICAgZ2VuZXJhdGU6IHRydWUsXHJcbiAgICAgICAgZmlsZU5hbWU6IEdMT0JfQ09ORklHX0ZJTEVfTkFNRSxcclxuICAgICAgICBvdXRwdXREaXI6IE9VVFBVVF9ESVIsXHJcbiAgICAgIH0sXHJcbiAgICAgIGVudlZhcmlhYmxlczoge1xyXG4gICAgICAgIHByZWZpeDogJ1ZJVEVfR0xPQl8nLFxyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgICBVbm9jc3MoKSxcclxuICAgIHZpdGVCdWlsZEluZm8oZW52LlZJVEVfQVBQX05BTUUpLFxyXG4gIF1cclxuICByZXR1cm4gdml0ZVBsdWdpbkxpc3RcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGpmd2xcXFxcMThncHNcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcamZ3bFxcXFwxOGdwc1xcXFxwbHVnaW5zXFxcXGNvbnN0YW50cy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovamZ3bC8xOGdwcy9wbHVnaW5zL2NvbnN0YW50cy50c1wiOy8vIFRoaXMgY29uc3RhbnQgZGVmaW5lcyB0aGUgbmFtZSBvZiB0aGUgY29uZmlndXJhdGlvbiBmaWxlIHRoYXQgd2lsbCBiZSB1c2VkIGluIHRoZSBwcm9kdWN0aW9uIGVudmlyb25tZW50XHJcbmV4cG9ydCBjb25zdCBHTE9CX0NPTkZJR19GSUxFX05BTUUgPSAnX2FwcC5jb25maWcuanMnXHJcblxyXG4vLyBUaGlzIGNvbnN0YW50IHNldHMgdGhlIG91dHB1dCBkaXJlY3RvcnkgZm9yIHRoZSBWaXRlIHBhY2thZ2VcclxuZXhwb3J0IGNvbnN0IE9VVFBVVF9ESVIgPSAnZGlzdCdcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGpmd2xcXFxcMThncHNcXFxccGx1Z2luc1xcXFx2aXRlLWJ1aWxkLWluZm8udHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2pmd2wvMThncHMvcGx1Z2lucy92aXRlLWJ1aWxkLWluZm8udHNcIjtpbXBvcnQgeyByZWFkZGlyLCBzdGF0IH0gZnJvbSAnbm9kZTpmcydcclxuaW1wb3J0IHR5cGUgeyBQbHVnaW4sIFJlc29sdmVkQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJ1xyXG5pbXBvcnQgdHlwZSB7IERheWpzIH0gZnJvbSAnZGF5anMnXHJcbmltcG9ydCBkdXJhdGlvbiBmcm9tICdkYXlqcy9wbHVnaW4vZHVyYXRpb24nXHJcbmltcG9ydCBwa2cgZnJvbSAncGljb2NvbG9ycydcclxuXHJcbmNvbnN0IHsgZ3JlZW4sIGJsdWUsIGJvbGQgfSA9IHBrZ1xyXG5kYXlqcy5leHRlbmQoZHVyYXRpb24pXHJcblxyXG5jb25zdCBmaWxlTGlzdFRvdGFsOiBudW1iZXJbXSA9IFtdXHJcblxyXG5mdW5jdGlvbiByZWN1cnNpdmVEaXJlY3RvcnkoZm9sZGVyOiBzdHJpbmcsIGNhbGxiYWNrOiBGdW5jdGlvbik6IHZvaWQge1xyXG4gIHJlYWRkaXIoZm9sZGVyLCAoZXJyLCBmaWxlczogc3RyaW5nW10pID0+IHtcclxuICAgIGlmIChlcnIpXHJcbiAgICAgIHRocm93IGVyclxyXG4gICAgbGV0IGNvdW50ID0gMFxyXG4gICAgY29uc3QgY2hlY2tFbmQgPSAoKSA9PiB7XHJcbiAgICAgICsrY291bnQgPT09IGZpbGVzLmxlbmd0aCAmJiBjYWxsYmFjaygpXHJcbiAgICB9XHJcbiAgICBmaWxlcy5mb3JFYWNoKChpdGVtOiBzdHJpbmcpID0+IHtcclxuICAgICAgc3RhdChgJHtmb2xkZXJ9LyR7aXRlbX1gLCBhc3luYyAoZXJyLCBzdGF0cykgPT4ge1xyXG4gICAgICAgIGlmIChlcnIpXHJcbiAgICAgICAgICB0aHJvdyBlcnJcclxuICAgICAgICBpZiAoc3RhdHMuaXNGaWxlKCkpIHtcclxuICAgICAgICAgIGZpbGVMaXN0VG90YWwucHVzaChzdGF0cy5zaXplKVxyXG4gICAgICAgICAgY2hlY2tFbmQoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgICAgICByZWN1cnNpdmVEaXJlY3RvcnkoYCR7Zm9sZGVyfS8ke2l0ZW19L2AsIGNoZWNrRW5kKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgICBmaWxlcy5sZW5ndGggPT09IDAgJiYgY2FsbGJhY2soKVxyXG4gIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN1bShhcnI6IG51bWJlcltdKSB7XHJcbiAgcmV0dXJuIGFyci5yZWR1Y2UoKHQ6IG51bWJlciwgYzogbnVtYmVyKSA9PiB7XHJcbiAgICByZXR1cm4gdCArIGNcclxuICB9LCAwKVxyXG59XHJcbmZ1bmN0aW9uIGZvcm1hdEJ5dGVzKGE6IG51bWJlciwgYj86IG51bWJlcik6IHN0cmluZyB7XHJcbiAgaWYgKGEgPT09IDApXHJcbiAgICByZXR1cm4gJzAgQnl0ZXMnXHJcbiAgY29uc3QgYyA9IDEwMjRcclxuICBjb25zdCBkID0gYiB8fCAyXHJcbiAgY29uc3QgZSA9IFsnQnl0ZXMnLCAnS0InLCAnTUInLCAnR0InLCAnVEInLCAnUEInLCAnRUInLCAnWkInLCAnWUInXVxyXG4gIGNvbnN0IGYgPSBNYXRoLmZsb29yKE1hdGgubG9nKGEpIC8gTWF0aC5sb2coYykpXHJcbiAgcmV0dXJuIGAke051bWJlci5wYXJzZUZsb2F0KChhIC8gYyAqKiBmKS50b0ZpeGVkKGQpKX0gJHtlW2ZdfWBcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHZpdGVCdWlsZEluZm8obmFtZTogc3RyaW5nKTogUGx1Z2luIHtcclxuICBsZXQgY29uZmlnOiBSZXNvbHZlZENvbmZpZ1xyXG4gIGxldCBzdGFydFRpbWU6IERheWpzXHJcbiAgbGV0IGVuZFRpbWU6IERheWpzXHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6ICd2aXRlOmJ1aWxkSW5mbycsXHJcbiAgICBjb25maWdSZXNvbHZlZChyZXNvbHZlZENvbmZpZykge1xyXG4gICAgICBjb25maWcgPSByZXNvbHZlZENvbmZpZ1xyXG4gICAgfSxcclxuICAgIGJ1aWxkU3RhcnQoKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgIGJvbGQoXHJcbiAgICAgICAgICBncmVlbihcclxuICAgICAgICAgICAgYFx1RDgzRFx1REM0Rlx1NkIyMlx1OEZDRVx1NEY3Rlx1NzUyOCR7Ymx1ZShgWyR7bmFtZX1dYCl9XHVGRjBDXHU3M0IwXHU1NzI4XHU2QjYzXHU1MTY4XHU1MjlCXHU0RTNBXHU2MEE4JHtjb25maWcuY29tbWFuZCA9PT0gJ2J1aWxkJyA/ICdcdTYyNTNcdTUzMDUnIDogJ1x1N0YxNlx1OEJEMSdcclxuICAgICAgICAgICAgfWAsXHJcbiAgICAgICAgICApLFxyXG4gICAgICAgICksXHJcbiAgICAgIClcclxuICAgICAgaWYgKGNvbmZpZy5jb21tYW5kID09PSAnYnVpbGQnKVxyXG4gICAgICAgIHN0YXJ0VGltZSA9IGRheWpzKG5ldyBEYXRlKCkpXHJcbiAgICB9LFxyXG4gICAgY2xvc2VCdW5kbGUoKSB7XHJcbiAgICAgIGlmIChjb25maWcuY29tbWFuZCA9PT0gJ2J1aWxkJykge1xyXG4gICAgICAgIGVuZFRpbWUgPSBkYXlqcyhuZXcgRGF0ZSgpKVxyXG4gICAgICAgIHJlY3Vyc2l2ZURpcmVjdG9yeShjb25maWcuYnVpbGQub3V0RGlyLCAoKSA9PiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcclxuICAgICAgICAgICAgYm9sZChcclxuICAgICAgICAgICAgICBncmVlbihcclxuICAgICAgICAgICAgICAgIGBcdTYwNkRcdTU1OUNcdTYyNTNcdTUzMDVcdTVCOENcdTYyMTBcdUQ4M0NcdURGODlcdUZGMDhcdTYwM0JcdTc1MjhcdTY1RjYke2RheWpzXHJcbiAgICAgICAgICAgICAgICAgIC5kdXJhdGlvbihlbmRUaW1lLmRpZmYoc3RhcnRUaW1lKSlcclxuICAgICAgICAgICAgICAgICAgLmZvcm1hdCgnbW1cdTUyMDZzc1x1NzlEMicpfVx1RkYwQ1x1NjI1M1x1NTMwNVx1NTQwRVx1NzY4NFx1NTkyN1x1NUMwRlx1NEUzQSR7Zm9ybWF0Qnl0ZXMoXHJcbiAgICAgICAgICAgICAgICAgICAgc3VtKGZpbGVMaXN0VG90YWwpLFxyXG4gICAgICAgICAgICAgICAgICApfVx1RkYwOWAsXHJcbiAgICAgICAgICAgICAgKSxcclxuICAgICAgICAgICAgKSxcclxuICAgICAgICAgIClcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGpmd2xcXFxcMThncHNcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcamZ3bFxcXFwxOGdwc1xcXFxwbHVnaW5zXFxcXHN2Z0J1aWxkZXIuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2pmd2wvMThncHMvcGx1Z2lucy9zdmdCdWlsZGVyLmpzXCI7aW1wb3J0IHsgcmVhZEZpbGVTeW5jLCByZWFkZGlyU3luYyB9IGZyb20gJ25vZGU6ZnMnXHJcblxyXG5sZXQgaWRQZXJmaXggPSAnJ1xyXG5jb25zdCBzdmdUaXRsZSA9IC88c3ZnKFtePitdLio/KT4vXHJcbmNvbnN0IGNsZWFySGVpZ2h0V2lkdGggPSAvKHdpZHRofGhlaWdodCk9XCIoW14+K10uKj8pXCIvZ1xyXG5cclxuY29uc3QgaGFzVmlld0JveCA9IC8odmlld0JveD1cIltePitdLio/XCIpL2dcclxuXHJcbmNvbnN0IGNsZWFyUmV0dXJuID0gLyhcXHIpfChcXG4pL2dcclxuXHJcbmZ1bmN0aW9uIGZpbmRTdmdGaWxlKGRpcikge1xyXG4gIGNvbnN0IHN2Z1JlcyA9IFtdXHJcbiAgY29uc3QgZGlyZW50cyA9IHJlYWRkaXJTeW5jKGRpciwge1xyXG4gICAgd2l0aEZpbGVUeXBlczogdHJ1ZSxcclxuICB9KVxyXG4gIGZvciAoY29uc3QgZGlyZW50IG9mIGRpcmVudHMpIHtcclxuICAgIGlmIChkaXJlbnQuaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICBzdmdSZXMucHVzaCguLi5maW5kU3ZnRmlsZShgJHtkaXIgKyBkaXJlbnQubmFtZX0vYCkpXHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3Qgc3ZnID0gcmVhZEZpbGVTeW5jKGRpciArIGRpcmVudC5uYW1lKVxyXG4gICAgICAgIC50b1N0cmluZygpXHJcbiAgICAgICAgLnJlcGxhY2UoY2xlYXJSZXR1cm4sICcnKVxyXG4gICAgICAgIC5yZXBsYWNlKHN2Z1RpdGxlLCAoJDEsICQyKSA9PiB7XHJcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZygrK2kpXHJcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkaXJlbnQubmFtZSlcclxuICAgICAgICAgIGxldCB3aWR0aCA9IDBcclxuICAgICAgICAgIGxldCBoZWlnaHQgPSAwXHJcbiAgICAgICAgICBsZXQgY29udGVudCA9ICQyLnJlcGxhY2UoY2xlYXJIZWlnaHRXaWR0aCwgKHMxLCBzMiwgczMpID0+IHtcclxuICAgICAgICAgICAgaWYgKHMyID09PSAnd2lkdGgnKSB7XHJcbiAgICAgICAgICAgICAgd2lkdGggPSBzM1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKHMyID09PSAnaGVpZ2h0Jykge1xyXG4gICAgICAgICAgICAgIGhlaWdodCA9IHMzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuICcnXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgaWYgKCFoYXNWaWV3Qm94LnRlc3QoJDIpKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnQgKz0gYHZpZXdCb3g9XCIwIDAgJHt3aWR0aH0gJHtoZWlnaHR9XCJgXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gYDxzeW1ib2wgaWQ9XCIke2lkUGVyZml4fS0ke2RpcmVudC5uYW1lLnJlcGxhY2UoJy5zdmcnLCAnJyl9XCIgJHtjb250ZW50fT5gXHJcbiAgICAgICAgfSlcclxuICAgICAgICAucmVwbGFjZSgnPC9zdmc+JywgJzwvc3ltYm9sPicpXHJcbiAgICAgIHN2Z1Jlcy5wdXNoKHN2ZylcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIHN2Z1Jlc1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3ZnQnVpbGRlcihwYXRoLCBwZXJmaXggPSAnaWNvbicpIHtcclxuICBpZiAocGF0aCA9PT0gJycpXHJcbiAgICByZXR1cm5cclxuICBpZFBlcmZpeCA9IHBlcmZpeFxyXG4gIGNvbnN0IHJlcyA9IGZpbmRTdmdGaWxlKHBhdGgpXHJcbiAgcmV0dXJuIHtcclxuICAgIG5hbWU6ICdzdmctdHJhbnNmb3JtJyxcclxuICAgIHRyYW5zZm9ybUluZGV4SHRtbChodG1sKSB7XHJcbiAgICAgIHJldHVybiBodG1sLnJlcGxhY2UoXHJcbiAgICAgICAgJzxib2R5PicsXHJcbiAgICAgICAgYFxyXG4gICAgICAgICAgPGJvZHk+XHJcbiAgICAgICAgICAgIDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zOnhsaW5rPVwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiIHN0eWxlPVwicG9zaXRpb246IGFic29sdXRlOyB3aWR0aDogMDsgaGVpZ2h0OiAwXCI+XHJcbiAgICAgICAgICAgICAgJHtyZXMuam9pbignJyl9XHJcbiAgICAgICAgICAgIDwvc3ZnPlxyXG4gICAgICAgIGAsXHJcbiAgICAgIClcclxuICAgIH0sXHJcbiAgfVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGVBQWU7QUFDeEIsU0FBUyxxQkFBcUI7QUFDOUIsWUFBWSxhQUFhO0FBQ3pCLFNBQVMsZUFBZTs7O0FDSHhCLE9BQU8sU0FBUztBQUNoQixPQUFPLFlBQVk7QUFDbkIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxvQkFBb0I7QUFDM0IsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTywwQkFBMEI7QUFDakMsT0FBTyxZQUFZO0FBQ25CLE9BQU8sbUJBQW1COzs7QUNQbkIsSUFBTSx3QkFBd0I7QUFHOUIsSUFBTSxhQUFhOzs7QUNKdU8sU0FBUyxTQUFTLFlBQVk7QUFFL1IsT0FBTyxXQUFXO0FBRWxCLE9BQU8sY0FBYztBQUNyQixPQUFPLFNBQVM7QUFFaEIsSUFBTSxFQUFFLE9BQU8sTUFBTSxLQUFLLElBQUk7QUFDOUIsTUFBTSxPQUFPLFFBQVE7QUFFckIsSUFBTSxnQkFBMEIsQ0FBQztBQUVqQyxTQUFTLG1CQUFtQixRQUFnQixVQUEwQjtBQUNwRSxVQUFRLFFBQVEsQ0FBQyxLQUFLLFVBQW9CO0FBQ3hDLFFBQUk7QUFDRixZQUFNO0FBQ1IsUUFBSSxRQUFRO0FBQ1osVUFBTSxXQUFXLE1BQU07QUFDckIsUUFBRSxVQUFVLE1BQU0sVUFBVSxTQUFTO0FBQUEsSUFDdkM7QUFDQSxVQUFNLFFBQVEsQ0FBQyxTQUFpQjtBQUM5QixXQUFLLEdBQUcsTUFBTSxJQUFJLElBQUksSUFBSSxPQUFPQSxNQUFLLFVBQVU7QUFDOUMsWUFBSUE7QUFDRixnQkFBTUE7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
