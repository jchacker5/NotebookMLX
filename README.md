# NotebookMLX

English | [简体中文](./zh_CN/README.md)

[Contributor Guide: Repository Guidelines](AGENTS.md)

> [meta-llama/NotebookLlama](https://github.com/meta-llama/llama-recipes/tree/main/recipes/quickstart/NotebookLlama)

I ported [NotebookLlama](https://github.com/meta-llama/llama-recipes/tree/main/recipes/quickstart/NotebookLlama) and
implemented it with [MLX](https://github.com/ml-explore/mlx) 🔥

It uses [mlx-community/Qwen2.5-1.5B-Instruct-bf16](https://huggingface.co/mlx-community/Qwen2.5-1.5B-Instruct-4bit) for
pre-processing the
PDF, [mlx-community/Qwen2.5-14B-Instruct-4bit](https://huggingface.co/mlx-community/Qwen2.5-14B-Instruct-4bit) for
creating
transcripts, [mlx-community/Qwen2.5-7B-Instruct-4bit](https://huggingface.co/mlx-community/Qwen2.5-7B-Instruct-4bit) for
rewrites, and [lucasnewman/f5-tts-mlx](https://huggingface.co/lucasnewman/f5-tts-mlx) for Text-to-Speech ⚡

> Citing the NotebookLlama outline.
> ![Outline.jpg](resources/Outline.jpg)


[Step 1](Step-1-PDF-Pre-Processing-Logic.ipynb): Pre-process PDF:
Use [mlx-community/Qwen2.5-1.5B-Instruct-bf16](https://huggingface.co/mlx-community/Qwen2.5-1.5B-Instruct-4bit) to
pre-process the PDF and save it in a .txt file.

[Step 2](Step-2-Transcript-Writer.ipynb): Transcript Writer:
Use [mlx-community/Qwen2.5-14B-Instruct-4bit](https://huggingface.co/mlx-community/Qwen2.5-14B-Instruct-4bit) to write a
podcast transcript from the text.

[Step 3](Step-3-Re-Writer.ipynb): Dramatic Re-Writer: Use
the [mlx-community/Qwen2.5-7B-Instruct-4bit](https://huggingface.co/mlx-community/Qwen2.5-7B-Instruct-4bit) model to
make the transcript more dramatic.

[Step 4](Step-4-TTS-Workflow.ipynb): Text-To-Speech Workflow:
Use [lucasnewman/f5-tts-mlx](https://huggingface.co/lucasnewman/f5-tts-mlx) to generate
a conversational podcast.

## The podcast audio

https://github.com/user-attachments/assets/c7cf2d2f-766f-4026-8442-c584f6a32292

## Star History

<a href="https://star-history.com/#maiqingqiang/NotebookMLX&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=maiqingqiang/NotebookMLX&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=maiqingqiang/NotebookMLX&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=maiqingqiang/NotebookMLX&type=Date" />
 </picture>
</a>
