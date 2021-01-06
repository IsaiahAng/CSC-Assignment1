using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace CSC_Task3.Controllers
{
    [Authorize]
    public class ValuesController : ApiController
    {

        // GET api/values/5
        public string Get()
        {
            var userName = this.RequestContext.Principal.Identity.Name;
            return String.Format("Hello, {0}.", userName);
        }

     
    }
}
