// This file is exporting an Object with a single key/value pair.
// However, because this is not a part of the logic of the application
// it makes sense to abstract it to another file. Plus, it is now easily
// extensible if the application needs to send different email templates
// (eg. unsubscribe) in the future.
module.exports = {

  confirm: obj => ({
    subject: `${obj.userName} has created the squares.`,
    html: `
    Your land total comes to $${obj.coords.length * 100}.
    <br>
    Transaction ID is ${obj.transactionId}.
    <br>
    Wallet Address is ${obj.walletaddr}.
    <br>
    ${obj.coords.join('\t\t')}
    `,
    text: `Thanks for reading.`
  })

}