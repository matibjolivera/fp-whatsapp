const venom = require('venom-bot');
const fetch = require("node-fetch");
const API_URL = 'https://fp-woocommerce.herokuapp.com/orders/';

const enabledStatuses = [
    'on-hold',
    'pago-efectivo',
    'pending',
    'processing',
    'completed',
    'etiqueta-impresa',
    'plazo-vencido'
]

venom
    .create()
    .then((client) => sendMessages(client))
    .catch((error) => {
        console.log(error);
    });

async function sendMessages(client) {
    const clientSender = client;

    process.on('SIGINT', function () {
        client.close();
    });

    try {

    } catch (error) {
        client.close();
    }

    await (async function () {
        let orders = await getOrders();
        for (let order of orders.result) {
            try {
                let billingClient = order.billing;
                let phone = getPhone(billingClient);
                console.log("Contacto: " + phone + '@c.us');

                if (true === order.saved && false === order.sent && enabledStatuses.includes(order.status)) {
                    await sendMessage(clientSender, phone, getMessage(billingClient, order.status, order.reference), order.reference);
                }
            } catch (e) {
                console.log("Error al enviar mensaje: " + e)
            }
        }
        setTimeout(arguments.callee, 60000);
    })();
}

async function getOrders() {
    try {
        let response = await fetch(API_URL);
        return await response.json();
    } catch (e) {
        setTimeout(arguments.callee, 60000);
        await getOrders();
    }
}

function getPhone(billingClient) {
    let phone = billingClient.phone;
    if (!phone.match(/^(54)/)) {
        phone = '54' + phone
    }
    return phone;
}

async function sendMessage(clientSender, phone, message, reference) {
        console.log("Message: " + message);
        await clientSender
            .sendText(phone + '@c.us', message)
            .then(async function (result) {
                console.log('Result: ', result);
                let response = await fetch(API_URL + reference, {
                    method: 'PATCH',
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        sent: true
                    })
                })
                console.log(response);
            })
            .catch((error) => {
                console.error('Error when sending: ', error);
            });
}

function getMessage(billingClient, status, reference) {
    console.log("Get message - Status: " + status);
    switch (status) {
        case 'on-hold':
        case 'pago-efectivo':
        case 'pending':
            return '¡Hola, ' + billingClient.first_name + '!' +
                '\n ¿Cómo estás? Nos comunicamos de Footprints Clothes, nos llegó tu pedido número #' + reference + '. \n' +
                'En caso de que hayas elegido para pagar por transferencia, envianos por acá el comprobante de pago. ' + ' \n' +
                'En caso de pagar al retirar personalmente por nuestra oficina en Almagro (CABA) nos comunicaremos con vos para coordinar.  \n' +
                'En caso de pagar con MercadoPago, ya te llegará un mensaje informando que recibimos el pago.\n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\n' +
                'Saludos.';
        case 'processing':
            return '¡Hola, ' + billingClient.first_name + '!' +
                '\n ¿Cómo estás? Nos comunicamos de Footprints Clothes, nos llegó tu pago del pedido número #' + reference + '. \n' +
                'Si elegiste envío por OCA, te estaremos enviando el código de seguimiento.' + ' \n' +
                'Si elegiste motomensajería o retiro personal por nuestra oficina en Almagro (CABA), nos comunicaremos con vos para ' +
                'coordinar fecha y hora. \n' +
                'Si ya retiraste y abonaste en nuestra oficina en Almagro (CABA) desestima este mensaje. \n' +
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
                'podrás ver el código de seguimiento en tu mail ( ' + billingClient.email + ')\n' +
                'Recordá revisar en no deseados (spam) si no lo encontrás en tu bandeja de entrada!\n' +
                'Si elegiste otro método de envío: desestimá este mensaje.\n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\n' +
                'Saludos.';
        case 'plazo-vencido':
            return '¡Hola, ' + billingClient.first_name + '!\n ' +
                '¿Cómo estás? Nos comunicamos de Footprints Clothes, con respecto a tu pedido #' + reference + '. \n' +
                'Te queríamos recordar que tu pedido está pendiente de pago. En caso de que necesites que te resolvamos alguna duda o tengas algún ' +
                'problema con el pago, te pedimos que nos consultes así te podemos asesorar.\n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\n' +
                'Saludos.';
    }
}
