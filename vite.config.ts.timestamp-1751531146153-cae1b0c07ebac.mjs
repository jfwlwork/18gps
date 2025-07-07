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
    test: {
      globals: true,
      environment: "jsdom"
    }
  };
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGx1Z2lucy9pbmRleC50cyIsICJwbHVnaW5zL2NvbnN0YW50cy50cyIsICJwbHVnaW5zL3ZpdGUtYnVpbGQtaW5mby50cyIsICJwbHVnaW5zL3N2Z0J1aWxkZXIuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9qZndsLzE4Z3BzL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJ1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXHJcbmltcG9ydCAqIGFzIHByb2Nlc3MgZnJvbSAnbm9kZTpwcm9jZXNzJ1xyXG5pbXBvcnQgeyBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHR5cGUgeyBDb25maWdFbnYsIFVzZXJDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgeyBjcmVhdGVWaXRlUGx1Z2lucyB9IGZyb20gJy4vcGx1Z2lucydcclxuaW1wb3J0IHsgT1VUUFVUX0RJUiB9IGZyb20gJy4vcGx1Z2lucy9jb25zdGFudHMnXHJcbmltcG9ydCB7IHN2Z0J1aWxkZXIgfSBmcm9tICcuL3BsdWdpbnMvc3ZnQnVpbGRlci5qcydcclxuXHJcbmNvbnN0IGJhc2VTcmMgPSBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgKHsgbW9kZSB9OiBDb25maWdFbnYpOiBVc2VyQ29uZmlnID0+IHtcclxuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCkpXHJcbiAgY29uc3QgcHJveHlPYmogPSB7fVxyXG4gIC8vIGlmIChtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmIGVudi5WSVRFX0FQUF9CQVNFX0FQSV9ERVYgJiYgZW52LlZJVEVfQVBQX0JBU0VfVVJMX0RFVikge1xyXG4gIC8vICAgcHJveHlPYmpbZW52LlZJVEVfQVBQX0JBU0VfQVBJX0RFVl0gPSB7XHJcbiAgLy8gICAgIHRhcmdldDogZW52LlZJVEVfQVBQX0JBU0VfVVJMX0RFVixcclxuICAvLyAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAvLyAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gIC8vICAgICAvLyByZXdyaXRlOiBwYXRoID0+IHBhdGgucmVwbGFjZShuZXcgUmVnRXhwKGBeJHtlbnYuVklURV9BUFBfQkFTRV9BUElfREVWfWApLCAnJyksXHJcbiAgLy8gICB9XHJcbiAgLy8gfVxyXG4gIHJldHVybiB7XHJcbiAgICBiYXNlOiAnLi8nLFxyXG4gICAgcGx1Z2luczogW3N2Z0J1aWxkZXIoJy4vc3JjL2Fzc2V0cy9zdmcvJyksIC4uLmNyZWF0ZVZpdGVQbHVnaW5zKGVudildLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZpbmQ6ICdkYXlqcycsXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2RheWpzL2VzbScsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXmRheWpzXFwvbG9jYWxlLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnZGF5anMvZXNtL2xvY2FsZScsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXmRheWpzXFwvcGx1Z2luLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnZGF5anMvZXNtL3BsdWdpbicsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAndnVlLWkxOG4nLFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IG1vZGUgPT09ICdkZXZlbG9wbWVudCcgPyAndnVlLWkxOG4vZGlzdC92dWUtaTE4bi5lc20tYnJvd3Nlci5qcycgOiAndnVlLWkxOG4vZGlzdC92dWUtaTE4bi5lc20tYnVuZGxlci5qcycsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXmFudC1kZXNpZ24tdnVlXFwvZXMkLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnYW50LWRlc2lnbi12dWUvZXMnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogL15hbnQtZGVzaWduLXZ1ZVxcL2Rpc3QkLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnYW50LWRlc2lnbi12dWUvZGlzdCcsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAvXmFudC1kZXNpZ24tdnVlXFwvbGliJC8sXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2FudC1kZXNpZ24tdnVlL2VzJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZpbmQ6IC9eYW50LWRlc2lnbi12dWUkLyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiAnYW50LWRlc2lnbi12dWUvZXMnLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogJ2xvZGFzaCcsXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogJ2xvZGFzaC1lcycsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAnfkAnLFxyXG4gICAgICAgICAgcmVwbGFjZW1lbnQ6IGJhc2VTcmMsXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBmaW5kOiAnficsXHJcbiAgICAgICAgICByZXBsYWNlbWVudDogYmFzZVNyYyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGZpbmQ6ICdAJyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiBiYXNlU3JjLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZmluZDogJ34jJyxcclxuICAgICAgICAgIHJlcGxhY2VtZW50OiByZXNvbHZlKGJhc2VTcmMsICcuL2VudW1zJyksXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDQwOTYsXHJcbiAgICAgIG91dERpcjogT1VUUFVUX0RJUixcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAgIHZ1ZTogWyd2dWUnLCAndnVlLXJvdXRlcicsICdwaW5pYScsICd2dWUtaTE4bicsICdAdnVldXNlL2NvcmUnXSxcclxuICAgICAgICAgICAgYW50ZDogWydhbnQtZGVzaWduLXZ1ZScsICdAYW50LWRlc2lnbi9pY29ucy12dWUnLCAnZGF5anMnXSxcclxuICAgICAgICAgICAgLy8gbG9kYXNoOiBbJ2xvYWRzaC1lcyddLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuXHJcbiAgICB0ZXN0OiB7XHJcbiAgICAgIGdsb2JhbHM6IHRydWUsXHJcbiAgICAgIGVudmlyb25tZW50OiAnanNkb20nLFxyXG4gICAgfSxcclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGpmd2xcXFxcMThncHNcXFxccGx1Z2luc1xcXFxpbmRleC50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovamZ3bC8xOGdwcy9wbHVnaW5zL2luZGV4LnRzXCI7aW1wb3J0IHR5cGUgeyBQbHVnaW5PcHRpb24gfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IHZ1ZUpzeCBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUtanN4J1xyXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tICd1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlJ1xyXG5pbXBvcnQgR2VuZXJhdGVDb25maWcgZnJvbSAndW5wbHVnaW4tY29uZmlnL3ZpdGUnXHJcbmltcG9ydCBDb21wb25lbnRzIGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnXHJcbmltcG9ydCBWaXRlUGx1Z2luUHJlbG9hZEFsbCBmcm9tICdAbWlzdGpzL3ZpdGUtcGx1Z2luLXByZWxvYWQnXHJcbmltcG9ydCBVbm9jc3MgZnJvbSAndW5vY3NzL3ZpdGUnXHJcbmltcG9ydCBBbnRkdlJlc29sdmVyIGZyb20gJ2FudGR2LWNvbXBvbmVudC1yZXNvbHZlcidcclxuaW1wb3J0IHsgR0xPQl9DT05GSUdfRklMRV9OQU1FLCBPVVRQVVRfRElSIH0gZnJvbSAnLi9jb25zdGFudHMnXHJcbmltcG9ydCB7IHZpdGVCdWlsZEluZm8gfSBmcm9tICcuL3ZpdGUtYnVpbGQtaW5mbydcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaXRlUGx1Z2lucyhlbnY6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pIHtcclxuICBjb25zdCB2aXRlUGx1Z2luTGlzdDogKFBsdWdpbk9wdGlvbiB8IFBsdWdpbk9wdGlvbltdKVtdID0gW1xyXG4gICAgdnVlKCksXHJcbiAgICB2dWVKc3goKSxcclxuICAgIFZpdGVQbHVnaW5QcmVsb2FkQWxsKCksXHJcbiAgICBBdXRvSW1wb3J0KHtcclxuICAgICAgaW1wb3J0czogW1xyXG4gICAgICAgICd2dWUnLFxyXG4gICAgICAgICd2dWUtcm91dGVyJyxcclxuICAgICAgICAndnVlLWkxOG4nLFxyXG4gICAgICAgICdAdnVldXNlL2NvcmUnLFxyXG4gICAgICAgICdwaW5pYScsXHJcbiAgICAgIF0sXHJcbiAgICAgIGR0czogJ3R5cGVzL2F1dG8taW1wb3J0cy5kLnRzJyxcclxuICAgICAgZGlyczogWydzcmMvc3RvcmVzJywgJ3NyYy9jb21wb3NhYmxlcyddLFxyXG4gICAgfSksXHJcbiAgICBDb21wb25lbnRzKHtcclxuICAgICAgcmVzb2x2ZXJzOiBbQW50ZHZSZXNvbHZlcigpXSxcclxuICAgICAgZHRzOiAndHlwZXMvY29tcG9uZW50cy5kLnRzJyxcclxuICAgICAgZGlyczogWydzcmMvY29tcG9uZW50cyddLFxyXG4gICAgfSksXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20va2lya2xpbi91bnBsdWdpbi1jb25maWdcclxuICAgIEdlbmVyYXRlQ29uZmlnKHtcclxuICAgICAgYmFzZURpcjogJy4vJyxcclxuICAgICAgYXBwTmFtZTogZW52LlZJVEVfR0xPQl9BUFBfVElUTEUsXHJcbiAgICAgIGNvbmZpZ0ZpbGU6IHtcclxuICAgICAgICBnZW5lcmF0ZTogdHJ1ZSxcclxuICAgICAgICBmaWxlTmFtZTogR0xPQl9DT05GSUdfRklMRV9OQU1FLFxyXG4gICAgICAgIG91dHB1dERpcjogT1VUUFVUX0RJUixcclxuICAgICAgfSxcclxuICAgICAgZW52VmFyaWFibGVzOiB7XHJcbiAgICAgICAgcHJlZml4OiAnVklURV9HTE9CXycsXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICAgIFVub2NzcygpLFxyXG4gICAgdml0ZUJ1aWxkSW5mbyhlbnYuVklURV9BUFBfTkFNRSksXHJcbiAgXVxyXG4gIHJldHVybiB2aXRlUGx1Z2luTGlzdFxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcamZ3bFxcXFwxOGdwc1xcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXFxcXHBsdWdpbnNcXFxcY29uc3RhbnRzLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9qZndsLzE4Z3BzL3BsdWdpbnMvY29uc3RhbnRzLnRzXCI7Ly8gVGhpcyBjb25zdGFudCBkZWZpbmVzIHRoZSBuYW1lIG9mIHRoZSBjb25maWd1cmF0aW9uIGZpbGUgdGhhdCB3aWxsIGJlIHVzZWQgaW4gdGhlIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRcclxuZXhwb3J0IGNvbnN0IEdMT0JfQ09ORklHX0ZJTEVfTkFNRSA9ICdfYXBwLmNvbmZpZy5qcydcclxuXHJcbi8vIFRoaXMgY29uc3RhbnQgc2V0cyB0aGUgb3V0cHV0IGRpcmVjdG9yeSBmb3IgdGhlIFZpdGUgcGFja2FnZVxyXG5leHBvcnQgY29uc3QgT1VUUFVUX0RJUiA9ICdkaXN0J1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGpmd2xcXFxcMThncHNcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcamZ3bFxcXFwxOGdwc1xcXFxwbHVnaW5zXFxcXHZpdGUtYnVpbGQtaW5mby50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovamZ3bC8xOGdwcy9wbHVnaW5zL3ZpdGUtYnVpbGQtaW5mby50c1wiO2ltcG9ydCB7IHJlYWRkaXIsIHN0YXQgfSBmcm9tICdub2RlOmZzJ1xyXG5pbXBvcnQgdHlwZSB7IFBsdWdpbiwgUmVzb2x2ZWRDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgZGF5anMgZnJvbSAnZGF5anMnXHJcbmltcG9ydCB0eXBlIHsgRGF5anMgfSBmcm9tICdkYXlqcydcclxuaW1wb3J0IGR1cmF0aW9uIGZyb20gJ2RheWpzL3BsdWdpbi9kdXJhdGlvbidcclxuaW1wb3J0IHBrZyBmcm9tICdwaWNvY29sb3JzJ1xyXG5cclxuY29uc3QgeyBncmVlbiwgYmx1ZSwgYm9sZCB9ID0gcGtnXHJcbmRheWpzLmV4dGVuZChkdXJhdGlvbilcclxuXHJcbmNvbnN0IGZpbGVMaXN0VG90YWw6IG51bWJlcltdID0gW11cclxuXHJcbmZ1bmN0aW9uIHJlY3Vyc2l2ZURpcmVjdG9yeShmb2xkZXI6IHN0cmluZywgY2FsbGJhY2s6IEZ1bmN0aW9uKTogdm9pZCB7XHJcbiAgcmVhZGRpcihmb2xkZXIsIChlcnIsIGZpbGVzOiBzdHJpbmdbXSkgPT4ge1xyXG4gICAgaWYgKGVycilcclxuICAgICAgdGhyb3cgZXJyXHJcbiAgICBsZXQgY291bnQgPSAwXHJcbiAgICBjb25zdCBjaGVja0VuZCA9ICgpID0+IHtcclxuICAgICAgKytjb3VudCA9PT0gZmlsZXMubGVuZ3RoICYmIGNhbGxiYWNrKClcclxuICAgIH1cclxuICAgIGZpbGVzLmZvckVhY2goKGl0ZW06IHN0cmluZykgPT4ge1xyXG4gICAgICBzdGF0KGAke2ZvbGRlcn0vJHtpdGVtfWAsIGFzeW5jIChlcnIsIHN0YXRzKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycilcclxuICAgICAgICAgIHRocm93IGVyclxyXG4gICAgICAgIGlmIChzdGF0cy5pc0ZpbGUoKSkge1xyXG4gICAgICAgICAgZmlsZUxpc3RUb3RhbC5wdXNoKHN0YXRzLnNpemUpXHJcbiAgICAgICAgICBjaGVja0VuZCgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcclxuICAgICAgICAgIHJlY3Vyc2l2ZURpcmVjdG9yeShgJHtmb2xkZXJ9LyR7aXRlbX0vYCwgY2hlY2tFbmQpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICAgIGZpbGVzLmxlbmd0aCA9PT0gMCAmJiBjYWxsYmFjaygpXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gc3VtKGFycjogbnVtYmVyW10pIHtcclxuICByZXR1cm4gYXJyLnJlZHVjZSgodDogbnVtYmVyLCBjOiBudW1iZXIpID0+IHtcclxuICAgIHJldHVybiB0ICsgY1xyXG4gIH0sIDApXHJcbn1cclxuZnVuY3Rpb24gZm9ybWF0Qnl0ZXMoYTogbnVtYmVyLCBiPzogbnVtYmVyKTogc3RyaW5nIHtcclxuICBpZiAoYSA9PT0gMClcclxuICAgIHJldHVybiAnMCBCeXRlcydcclxuICBjb25zdCBjID0gMTAyNFxyXG4gIGNvbnN0IGQgPSBiIHx8IDJcclxuICBjb25zdCBlID0gWydCeXRlcycsICdLQicsICdNQicsICdHQicsICdUQicsICdQQicsICdFQicsICdaQicsICdZQiddXHJcbiAgY29uc3QgZiA9IE1hdGguZmxvb3IoTWF0aC5sb2coYSkgLyBNYXRoLmxvZyhjKSlcclxuICByZXR1cm4gYCR7TnVtYmVyLnBhcnNlRmxvYXQoKGEgLyBjICoqIGYpLnRvRml4ZWQoZCkpfSAke2VbZl19YFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdml0ZUJ1aWxkSW5mbyhuYW1lOiBzdHJpbmcpOiBQbHVnaW4ge1xyXG4gIGxldCBjb25maWc6IFJlc29sdmVkQ29uZmlnXHJcbiAgbGV0IHN0YXJ0VGltZTogRGF5anNcclxuICBsZXQgZW5kVGltZTogRGF5anNcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ3ZpdGU6YnVpbGRJbmZvJyxcclxuICAgIGNvbmZpZ1Jlc29sdmVkKHJlc29sdmVkQ29uZmlnKSB7XHJcbiAgICAgIGNvbmZpZyA9IHJlc29sdmVkQ29uZmlnXHJcbiAgICB9LFxyXG4gICAgYnVpbGRTdGFydCgpIHtcclxuICAgICAgY29uc29sZS5sb2coXHJcbiAgICAgICAgYm9sZChcclxuICAgICAgICAgIGdyZWVuKFxyXG4gICAgICAgICAgICBgXHVEODNEXHVEQzRGXHU2QjIyXHU4RkNFXHU0RjdGXHU3NTI4JHtibHVlKGBbJHtuYW1lfV1gKX1cdUZGMENcdTczQjBcdTU3MjhcdTZCNjNcdTUxNjhcdTUyOUJcdTRFM0FcdTYwQTgke2NvbmZpZy5jb21tYW5kID09PSAnYnVpbGQnID8gJ1x1NjI1M1x1NTMwNScgOiAnXHU3RjE2XHU4QkQxJ1xyXG4gICAgICAgICAgICB9YCxcclxuICAgICAgICAgICksXHJcbiAgICAgICAgKSxcclxuICAgICAgKVxyXG4gICAgICBpZiAoY29uZmlnLmNvbW1hbmQgPT09ICdidWlsZCcpXHJcbiAgICAgICAgc3RhcnRUaW1lID0gZGF5anMobmV3IERhdGUoKSlcclxuICAgIH0sXHJcbiAgICBjbG9zZUJ1bmRsZSgpIHtcclxuICAgICAgaWYgKGNvbmZpZy5jb21tYW5kID09PSAnYnVpbGQnKSB7XHJcbiAgICAgICAgZW5kVGltZSA9IGRheWpzKG5ldyBEYXRlKCkpXHJcbiAgICAgICAgcmVjdXJzaXZlRGlyZWN0b3J5KGNvbmZpZy5idWlsZC5vdXREaXIsICgpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICAgICAgICBib2xkKFxyXG4gICAgICAgICAgICAgIGdyZWVuKFxyXG4gICAgICAgICAgICAgICAgYFx1NjA2RFx1NTU5Q1x1NjI1M1x1NTMwNVx1NUI4Q1x1NjIxMFx1RDgzQ1x1REY4OVx1RkYwOFx1NjAzQlx1NzUyOFx1NjVGNiR7ZGF5anNcclxuICAgICAgICAgICAgICAgICAgLmR1cmF0aW9uKGVuZFRpbWUuZGlmZihzdGFydFRpbWUpKVxyXG4gICAgICAgICAgICAgICAgICAuZm9ybWF0KCdtbVx1NTIwNnNzXHU3OUQyJyl9XHVGRjBDXHU2MjUzXHU1MzA1XHU1NDBFXHU3Njg0XHU1OTI3XHU1QzBGXHU0RTNBJHtmb3JtYXRCeXRlcyhcclxuICAgICAgICAgICAgICAgICAgICBzdW0oZmlsZUxpc3RUb3RhbCksXHJcbiAgICAgICAgICAgICAgICAgICl9XHVGRjA5YCxcclxuICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICApLFxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcamZ3bFxcXFwxOGdwc1xcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxqZndsXFxcXDE4Z3BzXFxcXHBsdWdpbnNcXFxcc3ZnQnVpbGRlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovamZ3bC8xOGdwcy9wbHVnaW5zL3N2Z0J1aWxkZXIuanNcIjtpbXBvcnQgeyByZWFkRmlsZVN5bmMsIHJlYWRkaXJTeW5jIH0gZnJvbSAnbm9kZTpmcydcclxuXHJcbmxldCBpZFBlcmZpeCA9ICcnXHJcbmNvbnN0IHN2Z1RpdGxlID0gLzxzdmcoW14+K10uKj8pPi9cclxuY29uc3QgY2xlYXJIZWlnaHRXaWR0aCA9IC8od2lkdGh8aGVpZ2h0KT1cIihbXj4rXS4qPylcIi9nXHJcblxyXG5jb25zdCBoYXNWaWV3Qm94ID0gLyh2aWV3Qm94PVwiW14+K10uKj9cIikvZ1xyXG5cclxuY29uc3QgY2xlYXJSZXR1cm4gPSAvKFxccil8KFxcbikvZ1xyXG5cclxuZnVuY3Rpb24gZmluZFN2Z0ZpbGUoZGlyKSB7XHJcbiAgY29uc3Qgc3ZnUmVzID0gW11cclxuICBjb25zdCBkaXJlbnRzID0gcmVhZGRpclN5bmMoZGlyLCB7XHJcbiAgICB3aXRoRmlsZVR5cGVzOiB0cnVlLFxyXG4gIH0pXHJcbiAgZm9yIChjb25zdCBkaXJlbnQgb2YgZGlyZW50cykge1xyXG4gICAgaWYgKGRpcmVudC5pc0RpcmVjdG9yeSgpKSB7XHJcbiAgICAgIHN2Z1Jlcy5wdXNoKC4uLmZpbmRTdmdGaWxlKGAke2RpciArIGRpcmVudC5uYW1lfS9gKSlcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBjb25zdCBzdmcgPSByZWFkRmlsZVN5bmMoZGlyICsgZGlyZW50Lm5hbWUpXHJcbiAgICAgICAgLnRvU3RyaW5nKClcclxuICAgICAgICAucmVwbGFjZShjbGVhclJldHVybiwgJycpXHJcbiAgICAgICAgLnJlcGxhY2Uoc3ZnVGl0bGUsICgkMSwgJDIpID0+IHtcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCsraSlcclxuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRpcmVudC5uYW1lKVxyXG4gICAgICAgICAgbGV0IHdpZHRoID0gMFxyXG4gICAgICAgICAgbGV0IGhlaWdodCA9IDBcclxuICAgICAgICAgIGxldCBjb250ZW50ID0gJDIucmVwbGFjZShjbGVhckhlaWdodFdpZHRoLCAoczEsIHMyLCBzMykgPT4ge1xyXG4gICAgICAgICAgICBpZiAoczIgPT09ICd3aWR0aCcpIHtcclxuICAgICAgICAgICAgICB3aWR0aCA9IHMzXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoczIgPT09ICdoZWlnaHQnKSB7XHJcbiAgICAgICAgICAgICAgaGVpZ2h0ID0gczNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gJydcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgICBpZiAoIWhhc1ZpZXdCb3gudGVzdCgkMikpIHtcclxuICAgICAgICAgICAgY29udGVudCArPSBgdmlld0JveD1cIjAgMCAke3dpZHRofSAke2hlaWdodH1cImBcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBgPHN5bWJvbCBpZD1cIiR7aWRQZXJmaXh9LSR7ZGlyZW50Lm5hbWUucmVwbGFjZSgnLnN2ZycsICcnKX1cIiAke2NvbnRlbnR9PmBcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5yZXBsYWNlKCc8L3N2Zz4nLCAnPC9zeW1ib2w+JylcclxuICAgICAgc3ZnUmVzLnB1c2goc3ZnKVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gc3ZnUmVzXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdmdCdWlsZGVyKHBhdGgsIHBlcmZpeCA9ICdpY29uJykge1xyXG4gIGlmIChwYXRoID09PSAnJylcclxuICAgIHJldHVyblxyXG4gIGlkUGVyZml4ID0gcGVyZml4XHJcbiAgY29uc3QgcmVzID0gZmluZFN2Z0ZpbGUocGF0aClcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ3N2Zy10cmFuc2Zvcm0nLFxyXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcclxuICAgICAgcmV0dXJuIGh0bWwucmVwbGFjZShcclxuICAgICAgICAnPGJvZHk+JyxcclxuICAgICAgICBgXHJcbiAgICAgICAgICA8Ym9keT5cclxuICAgICAgICAgICAgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM6eGxpbms9XCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIgc3R5bGU9XCJwb3NpdGlvbjogYWJzb2x1dGU7IHdpZHRoOiAwOyBoZWlnaHQ6IDBcIj5cclxuICAgICAgICAgICAgICAke3Jlcy5qb2luKCcnKX1cclxuICAgICAgICAgICAgPC9zdmc+XHJcbiAgICAgICAgYCxcclxuICAgICAgKVxyXG4gICAgfSxcclxuICB9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsZUFBZTtBQUN4QixTQUFTLHFCQUFxQjtBQUM5QixZQUFZLGFBQWE7QUFDekIsU0FBUyxlQUFlOzs7QUNIeEIsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUNuQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLG9CQUFvQjtBQUMzQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLDBCQUEwQjtBQUNqQyxPQUFPLFlBQVk7QUFDbkIs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QyxRQUFNLFdBQVcsQ0FBQztBQVNsQixTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTLENBQUMsV0FBVyxtQkFBbUIsR0FBRyxHQUFHLGtCQUFrQixHQUFHLENBQUM7QUFBQSxJQUNwRSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTDtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsUUFDZjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLGFBQWE7QUFBQSxRQUNmO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYSxTQUFTLGdCQUFnQiwwQ0FBMEM7QUFBQSxRQUNsRjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLGFBQWE7QUFBQSxRQUNmO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsUUFDZjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLGFBQWE7QUFBQSxRQUNmO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsUUFDZjtBQUFBLFFBQ0E7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLGFBQWE7QUFBQSxRQUNmO0FBQUEsUUFDQTtBQUFBLFVBQ0UsTUFBTTtBQUFBLFVBQ04sYUFBYTtBQUFBLFFBQ2Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxNQUFNO0FBQUEsVUFDTixhQUFhLFFBQVEsU0FBUyxTQUFTO0FBQUEsUUFDekM7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsdUJBQXVCO0FBQUEsTUFDdkIsUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBLFlBQ1osS0FBSyxDQUFDLE9BQU8sY0FBYyxTQUFTLFlBQVksY0FBYztBQUFBLFlBQzlELE1BQU0sQ0FBQyxrQkFBa0IseUJBQXlCLE9BQU87QUFBQTtBQUFBLFVBRTNEO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxhQUFhO0FBQUEsSUFDZjtBQUFBLEVBQ0Y7QUFDRjsiLAogICJuYW1lcyI6IFsiZXJyIl0KfQo=
