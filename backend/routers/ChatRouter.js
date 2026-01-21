const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const ChatModel = require('../models/chats');

const { ensureAuthenticated } = require('../middlewares/AuthValidation'); 

const upload = multer({ dest: 'uploads/' });

// Chat endpoint - sends message to FastAPI and saves history
router.post('/chat', ensureAuthenticated, async (req, res) => {
    try {
        const { message, session_id } = req.body;
        const userID = req.user._id;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Create form data for FastAPI
        const formData = new FormData();
        formData.append('question', message);
        if (session_id) {
            formData.append('session_id', session_id);
        }

        // Send to FastAPI chatbot
        const aiResponse = await axios.post(
            `${process.env.FASTAPI_URL}/chat`,
            formData,
            { headers: { ...formData.getHeaders() } }
        );

        const botReply = aiResponse.data.answer;
        const newSessionId = aiResponse.data.session_id;

        // Save to MongoDB chat history
        await ChatModel.findOneAndUpdate(
            { userID },
            {
                $push: {
                    history: [
                        { role: 'user', text: message },
                        { role: 'assistant', text: botReply }
                    ]
                }
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            success: true,
            reply: botReply,
            session_id: newSessionId
        });
    } catch (err) {
        console.error("Chat Error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to connect to AI server",
            error: err.message
        });
    }
});

// Upload PDF endpoint
router.post('/upload', ensureAuthenticated, upload.single('pdf'), async (req, res) => {
    try {
        const pdfFile = req.file;

        if (!pdfFile) {
            return res.status(400).json({ success: false, message: 'PDF file is required' });
        }

        // Create form data for FastAPI
        const formData = new FormData();
        formData.append('file', fs.createReadStream(pdfFile.path), {
            filename: pdfFile.originalname,
            contentType: 'application/pdf'
        });

        // Send to FastAPI for processing
        const aiResponse = await axios.post(
            `${process.env.FASTAPI_URL}/upload`,
            formData,
            { headers: { ...formData.getHeaders() } }
        );

        // Clean up uploaded file
        fs.unlinkSync(pdfFile.path);

        res.status(200).json({
            success: true,
            status: aiResponse.data.status,
            filename: aiResponse.data.filename
        });
    } catch (err) {
        console.error("Upload Error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to upload PDF",
            error: err.message
        });
    }
});

// Get chat history for user
router.get('/history', ensureAuthenticated, async (req, res) => {
    try {
        const userID = req.user._id;
        const chat = await ChatModel.findOne({ userID });

        if (!chat) {
            return res.status(200).json({ success: true, history: [] });
        }

        res.status(200).json({
            success: true,
            history: chat.history
        });
    } catch (err) {
        console.error("History Error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to get chat history"
        });
    }
});

// Delete chat history for user
router.delete('/history', ensureAuthenticated, async (req, res) => {
    try {
        const userID = req.user._id;
        await ChatModel.findOneAndDelete({ userID });

        res.status(200).json({
            success: true,
            message: "Chat history deleted"
        });
    } catch (err) {
        console.error("Delete History Error:", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete chat history"
        });
    }
});

module.exports = router;