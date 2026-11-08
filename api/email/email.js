const Mailer = require("nodemailer");

module.exports = function (HTML) {
    return new Promise((resolve, reject) => {

        const transportar = Mailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "yourmail@gmail.com",///
                pass: "yourpassword",////
            },
        });

        const mailOptions = {
            from: "PULSEYE <yourmail@gmail.com>",///
            to: "",/// manager`s email 
            subject: "worker`s data",
            html: `<div style="display:inline-block">${HTML}</div>`
        };


        // Send an Email
        transportar.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                reject(error)
            }
            resolve("ok")
            // console.log(info);
        });
    })
}