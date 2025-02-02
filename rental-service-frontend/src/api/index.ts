import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api", // Replace with your API base URL
  timeout: 1000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
