import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Cube Farm could not find its page root. Reload the page.');
ReactDOM.createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
