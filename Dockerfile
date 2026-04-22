FROM node:20-alpine

WORKDIR /app

# Instala as dependências
COPY package*.json ./
RUN npm install

# Copia todo o código fonte
COPY . .

# Faz o build da aplicação (gera a pasta .next otimizada)
RUN npm run build

# Configura o ambiente como produção
ENV NODE_ENV=production

# Garante que o Next.js vai rodar no host 0.0.0.0
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

EXPOSE 3000

# Inicia o servidor de produção
CMD ["npm", "run", "start"]
