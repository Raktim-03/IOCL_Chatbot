const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const ChatModel = require('../models/chats');


const { ensureAuthenticated } = require('../middlewares/AuthValidation'); 

const upload = multer({dest :'uploads'});

router.post('/chat', ensureAuthenticated, upload.single('pdf'), async(req, res) => {
    try {
        const { message } = req.body;
        const userID = req.user._id;
        const pdfFile = req.file;

        const form =new FormData();
        form.append('query', message);
        if(pdfFile){
            form.append('file', fs.createReadStream(pdfFile.path));
        }
        
        //paste the url :)
        // const aiResponse = await axios.post(`${process.env.FASTAPI_URL}/'query`, form,
        //    { headers : {...form.getHeaders()}}
        // )

        const botReply = AuthenticatorResponse.data.response;


        await ChatModel.findOneAndUpdate(
            {userID},
            {
                $push : {
                    messages : [{
                        role : 'user',
                        text : message,
                        pdfPath : pdfFile ? pdfFile.path : null
                    },
                    {
                        role : 'assistant',
                        text : botReply
                    }
                ]
                }
            },
            {upsert : true, new : true}
        )


        res.status(200).json({
            success: true,
            reply: botReply
        });
    } catch (err) {
        console.error("Chat Error :", err.message);
        res.status(500).json({
            success: false,
            message: "Failed to connect to AI server"
        });
    }
});

module.exports = router;