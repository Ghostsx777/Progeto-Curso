# Narração das aulas

Em Administração → Narrações, solicite a geração da versão atual de uma aula. O painel mostra a fila, erros e prévias. Ouça o resultado e use **Aprovar e liberar áudio** para disponibilizá-lo. Uma alteração ao Markdown exige nova revisão. A narração lê títulos, parágrafos e tabelas. O aluno pode estudar o código e os diagramas visualmente.

## Gerador local

Prepare um ambiente Python 3.12 em `../devpath-voz/venv`, instale `piper-tts==1.8.0` e `imageio-ffmpeg==0.8.1` e execute nesse ambiente:

```
python -m piper.download_voices --download-dir ../devpath-voz pt_BR-faber-medium
```

Na raiz do repositório, com as variáveis do servidor em .env.local, execute:

```
node --env-file=.env.local scripts/narrate.mjs
```

Cada execução processa até oito pedidos e termina. DEVPATH_VOICE_DIR e DEVPATH_VOICE_PYTHON permitem indicar outro diretório ou interpretador. Preserve a cache local para reutilizar áudios. O armazenamento remoto é privado e a reprodução usa um endereço temporário. A máquina de geração pode ficar desligada durante a reprodução.

O Piper sintetiza a voz neural brasileira Faber localmente, com custo de API de €0. Energia e equipamento dependem da máquina. A primeira aula ocupa 8,61 MB. Se outras 77 aulas tiverem a mesma duração, o curso ocupará aproximadamente 672 MB e dez reproduções completas transferirão cerca de 6,72 GB. Compare o uso agregado com as franquias do projeto antes de liberar o curso inteiro. A turma pode ouvir a mesma gravação quantas vezes permitir a franquia disponível.

[Piper](https://github.com/OHF-Voice/piper1-gpl) · [Ficha da voz](https://huggingface.co/rhasspy/piper-voices/blob/main/pt/pt_BR/faber/medium/MODEL_CARD) · [Franquias do Supabase](https://supabase.com/pricing)
