const swaggerJsDoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CampuSupport API",
      version: "1.0.0",
      description: "Kampüs Destek Sistemi API Dokümantasyonu",
      contact: {
        name: "Destek Ekibi",
        email: "destek@campusupport.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Yerel Geliştirme Sunucusu",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Hangi dosyalardaki yorumları okuyacak?
  apis: ["./routes/*.js"], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;