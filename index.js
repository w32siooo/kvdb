addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
 async function handleRequest(request) {

  const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS,PATCH",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Your-IP": request.headers.get("cf-connecting-ip"),
      "Your-Country": request.headers.get("CF-IPCountry"),
      "Host": request.headers.get("host")
  }

  if (request.method == "OPTIONS") { // Handel Preflight Requests
      return new Response(null, {
          status: 200,
          headers
      })

  } else if (request.method == "POST") { // Insert a JSON Payload
      if (new URL(request.url).searchParams.get('key') !== POSTKEY) {
          return new Response(JSON.stringify({
              status: false,
              msg: "Wrong key provided"
          }), {
              status: 401,
              headers
          })
      } else {
          var setpayload = await request.json()

          const value = await kvdb.list()
          const keyid = value.keys.length+1
          await kvdb.put(keyid, JSON.stringify(setpayload))

          return new Response(JSON.stringify({
              status: true,
              _id: keyid,
              query: `https://${request.headers.get("host")}/${keyid}`,
              data: setpayload
          }), {
              status: 200,
              headers
          })
      }
  } else if (request.method == "GET") { // Get a JSON Data
      var path = new URL(request.url).pathname
      if (path == "/") {
          return new Response(JSON.stringify({
              status: "Running",
              secret: `${POSTKEY}`
          }), {
              status: 200,
              headers
          })
      } else {
          var keyid = path.replace('/', '')
          var getpayload = await kvdb.get(keyid)
          if (getpayload == null) {
              return new Response(JSON.stringify({
                  status: false,
                  message: "Not Found"
              }), {
                  status: 200,
                  headers
              })
          } else {
              return new Response(JSON.stringify({
                  status: true,
                  _id: keyid,
                  data: JSON.parse(getpayload)
              }), {
                  status: 200,
                  headers
              })
          }
      }
  } else if (request.method == "DELETE") { // Delete a Document
      if (new URL(request.url).searchParams.get('key') !== DELETEKEY) {
          return new Response(JSON.stringify({
              status: false,
              msg: "Unauthorized"
          }), {
              status: 401,
              headers
          })
      } else {
          var path = new URL(request.url).pathname;
          if (path == '/') {
              return new Response(JSON.stringify({
                  status: false,
                  message: "Can't Delete /"
              }), {
                  status: 500,
                  headers
              })
          } else {
              await kvdb.delete(path.replace('/', ''))
              return new Response(JSON.stringify({
                  status: true,
                  msg: "Deleted Successfully"
              }), {
                  status: 200,
                  headers
              })
          }
      }
  } else if (request.method == "PATCH") { // Delete a Document
    var setpayload = await request.json()
    var keyid = setpayload._id
    
    const value = await kvdb.list()

    return new Response(value.keys.length)

    //return new Response(counter)

}  else { 
      return new Response(JSON.stringify({
          status: false,
          message: "Only supports GET, POST, DELETE, OPTIONS"
      }), {
          status: 500,
          headers
      })
  }
}
