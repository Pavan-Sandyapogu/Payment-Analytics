// Health Route Controller
const checkHealth = (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy and running smoothly',
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    checkHealth
};
