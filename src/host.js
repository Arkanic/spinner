const express = require("express");
let app = express();

app.use(express.static("src/client"));
app.listen(process.env.PORT || "8080", () => {
    console.log("Server Started.");
});