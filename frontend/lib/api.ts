import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5062/api",
});//Bu işlem yapıldığında, axios kütüphanesi kullanılarak bir API istemcisi oluşturulur
//ve bu istemci, belirli bir temel URL ile yapılandırılır.Bu temel URL, çevresel değişkenlerden alınır
//veya varsayılan olarak "http://localhost:5062/api" olarak ayarlanır.

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
});

export default api;