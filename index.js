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

const COORDINATOR_NUMBER = '+54 9 11-3623-9096'

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
                if (true === order.saved && false === order.sent && enabledStatuses.includes(order.status)) {
                    await sendMessage(clientSender, phone, getMessage(billingClient, order), order.reference);
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
    if (message) {
        await clientSender
            .sendText(phone + '@c.us', message)
            .then(async function (result) {
                console.log('Mensaje enviado correctamente a: ' + phone + ' - Reference: ' + reference);
                let response = await fetch(API_URL + reference, {
                    method: 'PATCH',
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        sent: true
                    })
                })
            })
            .catch((error) => {
                console.error('Error al intentar enviar a: ' + error.to + ' - no se pudo por: ' + error.text);
            });
    }
}

const ID_SHIPPING_TO_COORDINATE = 33;

function getMessage(billingClient, order) {
    let msg = null;
    const reference = order.reference
    switch (order.status) {
        case 'on-hold':
        case 'pending':
            msg = '¡Hola, ' + billingClient.first_name + '!' +
                '\n ¿Cómo estás? Nos comunicamos de Footprints Clothes, nos llegó tu pedido número #' + reference + '. \n' +
                'En caso de que hayas elegido para pagar por transferencia, envianos por acá el comprobante de pago. ' + ' \n' +
                'En caso de pagar con MercadoPago, ya te llegará un mensaje informando que recibimos el pago.\n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\n' +
                'Saludos.';
            break
        case 'pago-efectivo':
            msg = '¡Hola, ' + billingClient.first_name + '! \n ¿Cómo estás? Nos comunicamos de Footprints Clothes, nos llegó tu pedido número #' + reference + '. \n' + 'Te pedimos que por favor envíes un Whatsapp al siguiente contacto, indicando tu número de pedido (' + reference + '), para coordinar el retiro personal del pedido: ' + COORDINATOR_NUMBER
            break
        case 'processing':
            msg = '¡Hola, ' + billingClient.first_name + '!' +
                '\n ¿Cómo estás? Nos comunicamos de Footprints Clothes, nos llegó tu pago del pedido número #' + reference + '. \n' +
                'Si elegiste envío por OCA, te estaremos enviando el código de seguimiento.' + ' \n' +
                'Si elegiste motomensajería o retiro personal por nuestra oficina en Almagro (CABA), nos comunicaremos con vos para ' +
                'coordinar fecha y hora. \n' +
                'Si ya retiraste y abonaste en nuestra oficina en Almagro (CABA) desestima este mensaje. \n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá. Saludos.';
            break
        case 'completed':
            msg = '¡Hola, ' + billingClient.first_name + '!\n ' +
                '¿Cómo estás? Nos comunicamos de Footprints Clothes, con respecto a tu pedido #' + reference + '. \n' +
                'En caso de que hayas seleccionado envío por OCA, tu pedido ya fue despachado. En caso de haber retirado personalmente o recibido ' +
                'por motomensajería, confirmamos que el pedido ya está en tus manos.\n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\n' +
                'Saludos.'
            break
        case 'etiqueta-impresa':
            if (order.shipping_number) {
                msg = '¡Hola, ' + billingClient.first_name + '!\n¿Cómo estás? Nos comunicamos de Footprints Clothes, con respecto a tu pedido #' + reference + '. \n'
                msg += 'La etiqueta de envío por OCA ya fue generada. Tu código de seguimiento es ' + order.shipping_number + '\n Podés visitar el estado del pedido en: www.oca.com.ar/envios/paquetes/' + order.shipping_number
                msg += ' \nTe agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\nSaludos.';
            }
            break
        case 'plazo-vencido':
            msg = '¡Hola, ' + billingClient.first_name + '!\n ' +
                '¿Cómo estás? Nos comunicamos de Footprints Clothes, con respecto a tu pedido #' + reference + '. \n' +
                'Te queríamos recordar que tu pedido está pendiente de pago. En caso de que necesites que te resolvamos alguna duda o tengas algún ' +
                'problema con el pago, te pedimos que nos consultes así te podemos asesorar.\n' +
                'Te agradecemos y cualquier consulta que tengas nos la podés hacer por acá.\n' +
                'Saludos.'
            break
    }
    if (msg && 'shipping_method_id' in order && order.shipping_method_id === ID_SHIPPING_TO_COORDINATE) {
        msg += '\nENVÍO MOTOMENSAJERÍA CABA: Te pedimos que por favor envíes un Whatsapp al siguiente contacto, indicando tu número de pedido (' + reference + '), para coordinar el envío del pedido: ' + COORDINATOR_NUMBER
    }
    return msg
}
