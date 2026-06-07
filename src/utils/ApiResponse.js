// Standardize Success Response
//e.g
// {
//   "statusCode": 200,
//   "data": { "id": 1, "name": "Fahad" },
//   "message": "User fetched successfully",
//   "success": true
// }

class ApiResponse {
    constructor(statusCode, data, message = "Sucess") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export { ApiResponse }