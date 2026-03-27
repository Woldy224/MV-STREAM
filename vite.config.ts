export default {
  server: {
    proxy: {
      "/api": {
        target: "http://localhost/Projet/MV-STREAMReact/backend/public",
        changeOrigin: true,
        secure: false,
      },
    },
  },
};