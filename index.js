const venom = require('venom-bot');
const fetch = require("node-fetch");
const API_URL = 'https://fp-woocommerce.herokuapp.com/orders/';

venom
    .create()
    .then((client) => sendMessages(client))
    .catch((error) => {
        console.log(error);
    });

async function sendMessages(client) {
    const clientSender = client;
    await (async function () {
        let orders = await getOrders();
        for (let order of orders.result) {
            let billingClient = order.billing;
            let phone = getPhone(billingClient);
            console.log("Contacto: " + phone + '@c.us');

            await sendMessage(clientSender, phone);
        }
        setTimeout(arguments.callee, 60000);
    })();
}

async function getOrders() {
    let response = await fetch(API_URL);
    return await response.json();
}

function getPhone(billingClient) {
    let phone = billingClient.phone;
    if (!phone.match(/^(54)/)) {
        phone = '54' + phone
    }
    return phone;
}

async function sendMessage(clientSender, phone) {
    //if ('541134160701' === phone) { //TODO: Delete if
    await clientSender
        .sendText(phone + '@c.us', 'Test bot!')
        .then((result) => {
            console.log('Result: ', result);
        })
        .catch((error) => {
            console.error('Error when sending: ', error);
        });
    //}
}