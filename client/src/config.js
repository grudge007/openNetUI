export const getApiUrl = () => {
    const hostname = window.location.hostname;
    return `http://${hostname}:3001`;
};
