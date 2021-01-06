<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="BackendWeatherService.aspx.cs" Inherits="CSC_Assignment_Task1.BackendWeatherService" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <button onclick="redirect()"> Call the weather service using front-end (C#) </button>
    <form id="form1" runat="server">
        <div>
        </div>
    </form>
    <script>
        function redirect() {
            window.location.href = 'http://localhost:50861/CallWeatherService.html'
        }
    </script>
</body>
</html>