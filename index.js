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

            await sendMessage(clientSender, phone, getMessage(billingClient, order.status, order.reference));
        }
        setTimeout(arguments.callee, 2000);
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

async function sendMessage(clientSender, phone, message) {
    if ('541134160701' === phone) { //TODO: Delete if
        console.log("Message: " + message);
        await clientSender
            .sendText(phone + '@c.us', message)
            .then((result) => {
                console.log('Result: ', result);
            })
            .catch((error) => {
                console.error('Error when sending: ', error);
            });
    }
}

function getMessage(billingClient, status, reference) {
    switch (status) {
        case 'processing':
            return '¡Hola, ' + billingClient.first_name + '!' +
                '\n ¿Cómo estás? Nos comunicamos de Footprints Clothes, nos llegó tu pago del pedido número #' + reference + '. \n' +
                'Si elegiste envío por OCA, te estaremos enviando el código de seguimiento.' +
                'Si elegiste motomensajería o retiro personal por nuestra oficina en Almagro (CABA), nos comunicaremos con vos para ' +
                'coordinar fecha y hora. \n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá. Saludos.';
        case 'completed':
            return '¡Hola, ' + billingClient.first_name + '!\n ' +
                '¿Cómo estás? Nos comunicamos de Footprints Clothes, con respecto a tu pedido #' + reference + '. \n' +
                'En caso de que hayas seleccionado envío por OCA, tu pedido ya fue despachado. En caso de haber retirado personalmente o recibido ' +
                'por motomensajería, confirmamos que el pedido ya está en tus manos.\n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\n' +
                'Saludos.'
        case 'etiqueta-impresa':
            return '¡Hola, ' + billingClient.first_name + '!\n ' +
                '¿Cómo estás? Nos comunicamos de Footprints Clothes, con respecto a tu pedido #' + reference + '. \n' +
                'Si elegiste OCA como método de envío: la etiqueta para el envío a través de OCA a tu domicilio ya fue generada, ' +
                'podrás ver el código de seguimiento en tu mail\n' +
                'Recordá revisar en no deseados (spam) si no lo encontrás en tu bandeja de entrada!\n' +
                'Si elegiste otro método de envío: desestimá este mensaje.\n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\n' +
                'Saludos.';
    }
}