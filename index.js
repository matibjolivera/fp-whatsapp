// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require('venom-bot');
const fetch = require("node-fetch");
const API_URL = 'https://fp-woocommerce.herokuapp.com/orders';

venom
    .create()
    .then((client) => sendMessages(client))
    .catch((error) => {
        console.log(error);
    });

async function sendMessages(client) {
    const clientSender = client;
    await (async function () {
        let clients = await getClients();
        for (let e of clients.result) {
            let phone = e.billing.phone;
            if (!e.billing.phone.match(/^(54)/)) {
                phone = '54' + phone
            }
            console.log("Contacto: " + phone + '@c.us');

            await clientSender
                .sendText(phone + '@c.us', 'Test bot!')
                .then((result) => {
                    console.log('Result: ', result); //return object success
                })
                .catch((error) => {
                    console.error('Error when sending: ', error); //return object error
                });
        }
        setTimeout(arguments.callee, 60000);
    })();
}

async function getClients() {
    let response = await fetch(API_URL);
    return await response.json();
}