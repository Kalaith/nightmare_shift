/// <reference types="vite/client" />

// Allow importing CSS modules and plain CSS in TypeScript files
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css';

declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
