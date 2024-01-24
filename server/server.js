const monfoose = require('mongoose');
const Document = require('./Document');

mongoose.connect('mongodb://localhost/text-editor', {
    // Add relevant properties here
});

// Default initial value when creating a new document from scratch
const defaultValue = '';

// Socket.io initialisation
const io = require('socket.io')(3001, {
    // Allowing requests from the below host and port
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
})

// Listen for a socket connection
io.on('connection', socket => {

    // Clients want's to get the document by ID
    socket.on('get-document', async documentId => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);
        socket.emit('load-document', document.data);

        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        })

        socket.on('save-document', async data => {
            await Document.findByIdAndUpdate(documentId, { data });
        })
    });
})

async function findOrCreateDocument(id) {
    if (id == null) return;

    const document = await Document.findById(id);
    
    if (document) return document;

    return await Document.create({ _id: id, data: defaultValue});
}