<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-card title="Generate">
              <v-list three-line>
                  <v-list-item v-for="(message, mIndex) in messages" :key="mIndex">
                      <v-list-item-title>{{ message.role }} {{ mIndex }}</v-list-item-title>
                      <v-list-item-subtitle :class="message.role === 'assistant' && mIndex === messages.length - 1 ? 'stream' : ''">
                        {{ message.content }}
                      </v-list-item-subtitle>
                  </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-text-field label="Type your message" @keypress.enter="sendMessage" v-model="newMessage" append-icon="mdi-send" @click:append="sendMessage"></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { ref, reactive } from 'vue';

export default {
  data() {
    return {
      newMessage: '',
      stream: '',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI agent.',
        },
        // Add more messages here
      ],
      selectedItem: null,
    };
  },
  methods: {
    async sendMessage() {
      if (this.newMessage.trim() !== '') {
        this.messages.push({
          role: 'user',
          content: this.newMessage.trim(),
        });
        this.newMessage = '';
        this.messages.push({
          role: 'assistant',
          content: '',
        });
        const responseMessage = await this.chat([this.messages[this.messages.length - 1]]);
        this.messages.push(responseMessage);
      }
    },
    async chat() {
      try {
        const response = await fetch('http://10.13.34.154:9999/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'yi:6b-chat-q5_K_M',
            messages: this.messages,
          }),
        });

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to read response body');
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream finished');
            break;
          }
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          lines.map((line) => line.trim()).filter((line) => line !== '');
          document.querySelector('.v-list-item-subtitle.stream').innerHTML += lines
            .flat()
            .filter((x) => x)
            .map((x) => {
              let _j = JSON.parse(x);
              console.log(_j);
              return _j.message.content;
            })
            .join('');

        }
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>