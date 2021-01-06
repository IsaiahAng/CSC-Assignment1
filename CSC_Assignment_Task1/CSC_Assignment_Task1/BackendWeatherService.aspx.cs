using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Xml;
using Console = System.Diagnostics.Debug;

namespace CSC_Assignment_Task1
{
    public class DataObject
    {
        public string Name { get; set; }
    }

    public partial class BackendWeatherService : System.Web.UI.Page
    {
        private const string URL = "https://api.data.gov.sg/v1/environment/24-hour-weather-forecast";
        private string urlParameters = "?date_time=2020-11-28T09%3A09%3A10";

        protected void Page_Load(object sender, EventArgs e)
        {
            string weatherURL = String.Format("https://api.data.gov.sg/v1/environment/24-hour-weather-forecast?date_time=2020-11-28T09%3A09%3A10");
            WebRequest requestObjGet = WebRequest.Create(weatherURL);
            requestObjGet.Method = "GET";
            HttpWebResponse responseObjGet = null;
            responseObjGet = (HttpWebResponse)requestObjGet.GetResponse();

            string result = null;
            using(Stream stream = responseObjGet.GetResponseStream())
            {
                StreamReader sr = new StreamReader(stream);
                result = sr.ReadToEnd();
                Console.WriteLine(result);
                Response.Write(result);
                sr.Close();
            }
        }
    }
}