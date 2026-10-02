// Shared form handling for Rapid Knot. Change the webhook URL here and both forms update.
var RK_WEBHOOK = "https://discord.com/api/webhooks/1431857783870849148/ZR6eVRIoyIiQ1SBkyZmIp1WD5TaEXxAHyE3q5vWwbec2S0HuGg4vm-I0Fvm0rZT_jBqM";

// Sends a submission as a Discord embed. fields = [{name, value, inline}]. file is optional.
function rkSend(title, fields, file) {
  try {
    var last = Number(localStorage.getItem("rk_last")) || 0;
    if (Date.now() - last < 30000) {
      return Promise.reject(new Error("Please wait a few seconds before sending again."));
    }
  } catch (e) {}

  var embed = {
    title: String(title).slice(0, 250),
    color: 0x0E7C86,
    timestamp: new Date().toISOString(),
    fields: fields
      .filter(function (f) { return f.value; })
      .map(function (f) {
        return { name: f.name.slice(0, 250), value: String(f.value).slice(0, 1000), inline: !!f.inline };
      })
  };

  var payload = {
    username: "Rapid Knot Website",
    allowed_mentions: { parse: [] }, // stops submissions from pinging @everyone
    embeds: [embed]
  };

  // ?wait=true makes Discord reply with the posted message, so we can confirm the file is attached
  var url = RK_WEBHOOK + "?wait=true";

  function post(json, withFile) {
    var init = { method: "POST" };
    if (withFile) {
      var fd = new FormData();
      fd.append("payload_json", JSON.stringify(json));
      fd.append("files[0]", withFile, withFile.name);
      init.body = fd;
    } else {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(json);
    }
    return fetch(url, init).then(function (r) {
      if (!r.ok) throw new Error("Send failed");
      return r.json().catch(function () { return {}; });
    });
  }

  return post(payload, file).then(function (msg) {
    var attached = msg && msg.attachments && msg.attachments.length > 0;
    if (file && !attached) {
      // The text arrived but the file did not: send the file again as its own message
      return post({
        username: "Rapid Knot Website",
        allowed_mentions: { parse: [] },
        content: "Resume file for: " + String(title).slice(0, 200)
      }, file).then(function (m2) {
        if (!(m2 && m2.attachments && m2.attachments.length > 0)) throw new Error("Send failed");
      });
    }
  }).then(function () {
    try { localStorage.setItem("rk_last", String(Date.now())); } catch (e) {}
  });
}
