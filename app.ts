import "dotenv/config";
import express from "express";
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from "discord-interactions";
import { DiscordRequest } from "./utils.js";
import { Client, Collection, GatewayIntentBits, Guild } from "discord.js";

const app = express();
const PORT = process.env.PORT;
const publicKey = process.env.PUBLIC_KEY;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
if (publicKey !== undefined)
  app.post(
    "/sssmp/interactions",
    verifyKeyMiddleware(publicKey),
    async function (req, res) {
      // Interaction id, type and data
      const { id, type, data } = req.body;

      /**
       * Handle verification requests
       */
      if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
      }

      /**
       * Handle slash command requests
       * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
       */
      if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;

        // "test" command
        if (name === "test") {
          // Send a message into the channel where command was triggered from
          return res.send({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              flags: InteractionResponseFlags.IS_COMPONENTS_V2,
              components: [
                {
                  type: MessageComponentTypes.TEXT_DISPLAY,
                  // Fetches a random emoji to send from a helper function
                  content: `yoooo`,
                },
              ],
            },
          });
        }

        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: "unknown command" });
      }

      console.error("unknown interaction type", type);
      return res.status(400).json({ error: "unknown interaction type" });
    },
  );

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
app.all("/*", async function (req, res) {
  console.log(`Got request: ${req.method}; ${req.url}`);
});

//gateway stuff

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

var guild: Guild | undefined;

client.once("clientReady", async () => {
  var user = client.user;
  if (user == null) return;
  console.log(`Gateway connected as ${user.tag}`);
  guild = client.guilds.cache.get("1411064074858401814");
  user.setPresence({
    status: "online",
    activities: [{ name: "use /link to link your account", type: 0 }],
  });
});

client.on("messageCreate", async (message) => {
  var user = client.user;
  if (user == null || guild === undefined) return;
  if (message.mentions.has(user) && !message.author.bot) {
    try {
      var member = message.member;
      if (member == null) return;

      var roles = Array.of();
      member.roles.cache.forEach((v, k) => {
        roles.push(v.name);
      });

      var users = Array.of();
      await guild.members.fetch().then((collection) => {
        collection.forEach((v, k, m) => {
          users.push(JSON.stringify(v));
        });
      });

      var messagesInNews: Array<{ role: String; content: String }> = Array.of();
      var newsChannel = guild.channels.cache.get("1411120980234862632");
      if (newsChannel?.isTextBased()) {
        const col = await newsChannel.messages.fetch();
        col.forEach((message, k, m) => {
          var roles2 = Array.of();
          var memebr = message.member;
          if (memebr == null) return;
          memebr.roles.cache.forEach((v3, k3) => {
            roles2.push(v3.name);
          });
          messagesInNews.push({
            role: "system",
            content: `This message was sent in the #news channel, a channel with updates about the server, and some other things. This message was send by ${message.author.username}, and they have the roles: ${roles2.toString()}. This message was sent at ${message.createdTimestamp}. The message goes as follows: "${message.content}"`,
          });
        });
      }

      var channelIn = message.channel;
      var messagesInCurrent: Array<{ role: String; content: String }> =
        Array.of();
      if (channelIn?.isTextBased()) {
        const col = await channelIn.messages.fetch();
        col.forEach((message, k, m) => {
          var roles2 = Array.of();
          var memebr = message.member;
          if (memebr == null) return;
          memebr.roles.cache.forEach((v3, k3) => {
            roles2.push(v3.name);
          });
          messagesInCurrent.push({
            role: "system",
            content: `This message was sent in the current channel. This message was send by ${message.author.username}, and they have the roles: ${roles2.toString()}. This message was sent at ${message.createdTimestamp}. The message goes as follows: "${message.content}"`,
          });
        });
      }
      var peopleChannel = guild.channels.cache.get("1432521014084108448");
      var messagesInPeople: Array<{ role: String; content: String }> =
        Array.of();
      if (peopleChannel?.isTextBased()) {
        const col = await peopleChannel.messages.fetch();
        col.forEach((message, k, m) => {
          var roles2 = Array.of();
          var memebr = message.member;
          if (memebr == null) return;
          memebr.roles.cache.forEach((v3, k3) => {
            roles2.push(v3.name);
          });
          messagesInPeople.push({
            role: "system",
            content: `This message was sent in the #people, a channel saying who everyone is, and some other things. This message was send by ${message.author.username}, and they have the roles: ${roles2.toString()}. This message was sent at ${message.createdTimestamp}. The message goes as follows: "${message.content}"`,
          });
        });
      }

      var mess = `You are a discord bot, called SSSMP Bot, and you have been mentioned, 
    which means that now you have to respond to their message. 
    SSSMP is a minecraft server, it stands for South Shore SMP,
   because it has lots of people from bridgewater NS. 
   People already know the info just mentioned, so dont repeat it. 
   You have to respond in less than 4000 characters, 
            the users in the server are: "${users.toString()}", 
            this message is from display name: "${message.author.displayName}", 
            and username: ${message.author.username}. 
            You can use markdown, since this is a discord message. 
            The roles of this user is: ${roles.toString()}. 
            The owner of the server, and the person writing this context right now is _FN10_. 
            You can be a bit looser on these rules with me, 
            and if i ask a question that breaks you out of character, its fine. 
            Don't mention me in every response.
            Call people mainly by their display name.
            Your username is: ${user.username}, and your user id is: ${user.id}.
            NEVER MENTION EVERYONE, do not put @everyone in your reply, or else you will start talking to yourself forever.
            The message goes as follows: "${message.content}"`;

      var body = JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          ...messagesInNews,
          ...messagesInCurrent,
          ...messagesInPeople,
          {
            role: "user",
            content: mess,
          },
        ],
        stream: false,
      });

      console.log(body);

      fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AI_KEY}`,
          "Content-Type": "application/json",
        },
        body: body,
      })
        .then((res) => {
          if (res.ok) return res.text();
          else console.log(res.status);
        })
        .then((text) => {
          if (text === undefined) return;
          const json = JSON.parse(text);
          console.log(text);
          message.reply(json.choices[0].message.content);
        });
    } catch (error) {
      console.log(error);
      message.reply(`**An error has occured.**\n${error}`)
    }
  }
});

client.login(process.env.BOT_TOKEN);
