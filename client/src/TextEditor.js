import { useCallback, useEffect, useState } from 'react'
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

// Settings for the toolbar
// More docs for customising: https://quilljs.com/docs/modules/toolbar/
const TOOLBAR_OPTIONS = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['bold', 'italic', 'underline'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ align: [] }],
    ['image', 'blockquote', 'code-block'],
    ['clean'],
];

export default function TextEditor() {
    const {id: documentId} = useParams();
    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();

    // Connect to the web socket
    useEffect(() => {
        const s = io('http://localhost:3001')
        setSocket(s);

        return () => {
            s.disconnect();
        }
    }, []);

    useEffect(() => {
        if (socket == null || quill == null) return;

        socket.once('load-document', document => {
            quill.setContents(document);
            quill.enable();
        })
        socket.emit('get-document', documentId);
    }, [socket, quill, documentId]);

    // Emit send-changes when Quill tells us we changed the document
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return;

            socket.emit('send-changes', delta)
        };

        quill.on('text-change', handler);

        return () => {
            quill.off('text-change', handler);
        }
    }, [socket, quill]);

    // Receive changes from the server
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta) => {
            quill.updateContents(delta);
        };

        socket.on('receive-changes', handler);

        return () => {
            socket.off('receive-changes', handler);
        }
    }, [socket, quill]);

    // Initialise and append Quill
    const wrapperRef = useCallback(wrapper => {
        if (wrapper == null) return;

        wrapper.innerHTML = '';
        const editor = document.createElement('div');
        wrapper.append(editor);
        const q = new Quill(editor, {
            theme: 'snow',
            modules: { toolbar: TOOLBAR_OPTIONS }
        });

        // Disable editing and show a loading message until we load a document
        q.disable();
        q.setText('Loading...');
        setQuill(q);

    }, []);

    return <div className="container" ref={wrapperRef}></div>
}
