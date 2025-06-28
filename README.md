<p align="center">
    <img src="src/renderer/assets/app-icon/catana_64.png" alt="Catana Logo"/>
</p>

# Catana

> [!IMPORTANT]  
> This project is in very early stages of development, with lots of core functionality still missing. This readme is currently more of an aspiration than a reality, and the software is missing a lot of stuff to be considered production-ready. If you still want to give it a try, read [Testing Catana](#testing-catana).


## What is Catana?
Catana was born from my desire to have a note-taking software that works similar to [Tana](https://tana.inc), but able to interface with my local files better and without having to put all my data into yet another web service that I don't control.

Catana aspires to be _the_ central hub for your personal, digital life, without making you give up control over your data. That includes being:
- A place to put and link all your notes, thoughts, etc. (Some people call this a "Second Brain", even though I don't particularly like that term)
- A personal journal
- A management tool for your personal tasks and projects
- A file manager (possibly. Let's see if we get there)

Catana is not, and will likely never be:
- A collaboration tool. I want this to work for me and my personal life. Adding any kind of collaboration functionality would be a cross-cutting concern that massively complicates every aspect of how Catana works and needs to be developed. You might find ways to make it work well enough for you, but it's not going to be a primary concern for the foreseeable future.

## Why not use [Obsidian](https://obsidian.md) or [Logseq](https://logseq.com)?
I tried. Neither of them really clicked for me the way that Tana did, although Logseq came close. I attribute most of their shortcomings to being not only local-first, but markdown-first. I care about the former, but not that much about the latter. Going markdown-first forces them into compromises that I don't agree with:
- Pages and blocks within those pages (and folders in the case of Obsidian) are separate concepts. Constantly having to manage that distinction when working with my graph, deciding whether to either create a new block or link a new file instead, and converting between them causes too much friction and frustration.
  I want a flexible data model where _everything_ is a node that can easily be moved, linked and transcluded anywhere in my knowledge graph, and hierarchy is created purely by nesting nodes.
- Consequence of the previous point: Editing a linked page requires you to open that page. Just unfolding it in-place like you can with any Node in Tana is super convenient.
- Managing semi-structured data is a pain. Supertags in Tana are awesome and make tags and properties in Obsidian and Logseq feel like crude workarounds.
- You can't link other pages in page names. This makes working with linked atomic notes that might only consist of a single sentence annoying.
- In the case of Obsidian, I can't use special characters in page names.

Granted, some or even all of these _could_ probably be overcome even with a markdown-first approach, but Obsidian and Logseq haven't, and it would be more complicated than I'm willing to deal with.
With Catana, I am explicitly not making markdown-compatibility a goal, in exchange for getting the more structured and flexible internal model that I liked so much about Tana.

I still want Catana to have a file system integration so that any kind of file, including markdown files, can be linked to and made part of your knowledge graph. It's just not going to be the core persistence mechanism. I'm still fleshing out my thoughts around this at the current time.

---

## Testing Catana
If you want to test Catana in its current state, here are some things to keep in mind:
- Download the latest version from the [Releases Page](https://github.com/roschlau/catana/releases). There is no auto-update for new versions yet, so for now, the best way to stay up to date is subscribing to release notifications on this repository. You can also follow me on [Bluesky](https://bsky.app/profile/das-robin.bsky.social) or [Mastodon](https://defcon.social/@das_robin) to follow development!
- The UI is very barebones, most actions are available only via keyboard shortcut and/or the command prompt. If in doubt, press Ctrl+K and search for what you're looking for, but there's a high chance that it might not be implemented yet.
- No guarantees on backwards-compatibility. Your workspaces might need manual intervention to keep working with newer versions of the app.
- Bugs might happen. Save early, save often, back up your data. Here's what you need to know about how Catana saves your data and tries to keep it safe:
  - To open a workspace, you chose a directory on your PC. Catana will create a `.catana` file in that directory. Currently, this file contains all content you create in Catana, although that might change in the future. It is using plain JSON, so manually editing it is possible if necessary. Refer to [workspace-file-schema.ts](src/main/workspace-file-schema.ts) for the arktype schema.
  - If something goes wrong, the first thing to try is Ctrl+Z. Almost all application state is captured in the undo history, so that's your first way out.
  - There is currently no auto-save. Catana only saves when you explicitly request it via Ctrl+S. If something seems entirely messed up, you can close the window and chose "Discard and Close" when asked if you want to save, and you'll be back to the last time you saved.
  - If you have git installed, Catana will automatically initialize a git repo in any workspace that you open, and add a commit whenever you save. This way you can access any previously saved state easily in case the `.catana` file becomes corrupted or stuff got accidentally deleted.
