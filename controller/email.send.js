const nodemailer = require('nodemailer')

// The credentials for the email account you want to send mail from. 

const credentials = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    // These environment variables will be pulled from the .env file
    user: 'VeriArtiofficial@gmail.com', 
    pass: 'vechain123'  
  }
}

// Getting Nodemailer all setup with the credentials for when the 'sendEmail()'
// function is called.
const transporter = nodemailer.createTransport(credentials)

module.exports = async (to, content) => {
  // The from and to addresses for the email that is about to be sent.
  const contacts = {
    from: 'VeriArtiofficial@gmail.com',
    to
  }
  const email = Object.assign({}, content, contacts)

  var transMail;
  try{
    await transporter.sendMail(email)
  } catch(e){
      console.error(e.message)
      return false
  }
}