# Catana

> [!IMPORTANT]  
> This project is in very early stages of development, with lots of core functionality still missing. It is not ready for any kind of productive use. I'll update this note once that changes.

## What is Catana?
Catana was born from my desire to have an outliner / note taker / "second brain" that works similar to [Tana](https://tana.inc), but without having to put all my data into yet another web service that I don't control.

Catana aspires to be _the_ central hub for your personal, digital life, without making you give up control over you data. That includes being:
- A place to put and link all your notes, thoughts, etc. (Some people call this a "Second Brain", even though I don't particularly like that term)
- A personal journal
- A management tool for your personal tasks and projects
- A file manager (possibly. Let's see if we get there)

Catana is not, and will probably never be:
- A team collaboration tool. I want this to work for me and my personal life. Adding any kind of collaboration aspect would be a cross-cutting concern that massively complicates every aspect of how Catana works and needs to be developed. You might find ways to make it work well enough, but it's never going to be a primary concern.

## Why not use [Obsidian](https://obsidian.md) or [Logseq](https://logseq.com)?
I tried. Neither of them really clicked for me the way that Tana did, although Logseq came close. I attribute most of their shortcomings to being not only local-first, but markdown-first. I care about the former, but not that much about the latter. Going markdown-first forces them into compromises that I don't agree with:
- Pages and blocks within those pages (and folders in the case Obsidian) are separate concepts. Constantly having to manage that distinction when working with my graph, deciding whether to either create a new block or link a new file instead, and converting between them causes too much friction and frustration.
  I want a flexible data model where _everything_ is a block/node that can easily be moved, linked and transcluded anywhere in my knowledge graph.
- Consequence of the previous point: Editing a linked page requires you to open that page. Just unfolding it in-place like you can with any Node in Tana is super convenient.
- Managing semi-structured data is a pain. Supertags in Tana are awesome and make tags and properties in Obsidian and Logseq feel like crude workarounds.
- You can't link other pages in page names. This makes working with linked atomic notes that might only consist of a single sentence annoying.
- In the case of Obsidian, I can't use special characters in page names.

Granted, some or all of these _could_ probably be overcome even with a markdown-first approach, but Obsidian and Logseq haven't, and it would be more complicated than I'm will to deal with.
With Catana, I am explicitly not making markdown-compatibility a goal, in order to get the more structured and flexible internal model that I liked so much about Tana.

I still want Catana to have a file system integration so that any kind of file can be linked to and made part of your knowledge graph, but it is not going to be the core persistence mechanism. I'm still fleshing out my thoughts around this at the current time.
