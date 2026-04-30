const express = require("express");
const fs = require("fs");
const path = require("path");
const { initializeDatabase } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// Serve static files from FrontEnd folder
const frontEndPath = path.join(__dirname, "FrontEnd");
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.static(frontEndPath, { index: false, fallthrough: true }));

const authRoutes = require("./routes/authroutes");
const healthRoutes = require("./routes/healthroutes");
const inquiryRoutes = require("./routes/inquiryroutes");
const kunjunganRoutes = require("./routes/kunjunganroutes");
const medicinesRoutes = require("./routes/medicinesroutes");
const adjustRoutes = require("./routes/adjustroutes");

app.use("/auth", authRoutes);
app.use("/health", healthRoutes);
app.use("/inquiry", inquiryRoutes);
app.use("/kunjungan", kunjunganRoutes);
app.use("/medicines", medicinesRoutes);
app.use("/adjust", adjustRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(frontEndPath, "login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(frontEndPath, "login.html"));
});

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

// Initialize database and start server
initializeDatabase().then((dbAvailable) => {
    if (dbAvailable) {
        console.log('✅ Full database functionality enabled');
    } else {
        console.log('⚠️  Running in demo mode (JSON files) - MySQL not available');
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
        console.log('📱 Frontend: http://localhost:3000');
        console.log('🔗 API Base: http://localhost:3000');
    });
}).catch(error => {
    console.error('❌ Critical error during startup:', error);
    console.log('🔄 Starting server in demo mode...');

    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT} (Demo Mode)`);
        console.log('📱 Frontend: http://localhost:3000');
        console.log('🔗 API Base: http://localhost:3000');
        console.log('⚠️  Database features disabled - using JSON files');
    });
});