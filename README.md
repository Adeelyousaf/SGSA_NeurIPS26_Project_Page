# Safe in Its Own Words: Self-Guided Safety Alignment for Multimodal Reasoning Models

Static project page for the NeurIPS 2026 paper:

```bibtex
@inproceedings{yousaf2026safe,
  title     = {Safe in Its Own Words: Self-Guided Safety Alignment for Multimodal Reasoning Models},
  author    = {Yousaf, Adeel and Chakraborty, Souradip and Shah, Mubarak and Bedi, Amrit Singh},
  booktitle = {Advances in Neural Information Processing Systems (NeurIPS)},
  year      = {2026}
}
```

The page follows the design of the SAGE (ECCV 2026) page,
https://adeelyousaf.github.io/SAGE_ECCV26_Project_Page/, which is based on the
Nerfies template: https://github.com/nerfies/nerfies.github.io

All numbers on the page are LLaVA-CoT results from the camera-ready paper.

## Preview

Serve the folder over HTTP and open http://localhost:8000:

```bash
python3 -m http.server 8000
```

## Adding links as they go live

The hero buttons for NeurIPS Page, arXiv, Dataset, Video and Poster are
placeholders marked `is-soon`. To activate one, edit its `<a>` in `index.html`:
add `href`, `target="_blank"` and `rel="noopener noreferrer"`, then remove
`is-soon`, `aria-disabled="true"`, `title="Coming soon"` and the
`<span class="soon-tag">soon</span>`.

- **arXiv**: activate the button, add the arXiv icon link in the footer
  (commented out there), and extend the BibTeX with
  `eprint`, `archivePrefix = {arXiv}` and `primaryClass`.
- **NeurIPS page**: activate the button and point the NeurIPS logo link in the
  hero (currently the NeurIPS 2026 home page) at the paper's virtual page.
- **Dataset**: activate the button with the Hugging Face dataset URL.
- **Video**: activate the button, then uncomment the `VIDEO` section near the
  end of `index.html` and replace `VIDEO_ID`.
- **Poster**: put a web-sized PDF at `static/pdfs/poster.pdf` and a JPEG preview
  at `static/images/poster-preview.jpg`, activate the button, and uncomment the
  `POSTER` section.
- **Code**: a ready-made button is commented out after the Poster button.

## Link preview

The Open Graph and Twitter tags in `index.html` use absolute URLs that assume
the page is served from
`https://adeelyousaf.github.io/SGSA_NeurIPS26_Project_Page/`. If the repository
has a different name, update `og:url`, `og:image` and `twitter:image`.
The card itself is `static/images/og-preview.jpg` (1200x630).

## Website License

This website follows the Nerfies template license and is licensed under a
[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).
