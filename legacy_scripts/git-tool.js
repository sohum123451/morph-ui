#!/usr/bin/env node
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = process.cwd();

async function run() {
  const [cmd, ...args] = process.argv.slice(2);

  if (!cmd || cmd === 'status') {
    const matrix = await git.statusMatrix({ fs, dir });
    console.log('\n--- Git Status Matrix ---');
    let changed = 0;
    for (const [filepath, head, workdir, stage] of matrix) {
      if (filepath.startsWith('.git') || filepath.startsWith('node_modules')) continue;
      if (head !== workdir || stage !== workdir) {
        console.log(`  ${workdir === 0 ? 'D' : head === 0 ? 'A' : 'M'} ${filepath}`);
        changed++;
      }
    }
    if (changed === 0) console.log('Working tree clean.');
    const branch = await git.currentBranch({ fs, dir });
    console.log(`Current branch: ${branch}\n`);
    return;
  }

  if (cmd === 'branch') {
    const branchName = args[0];
    if (!branchName) {
      const branches = await git.listBranches({ fs, dir });
      console.log('Branches:', branches.join(', '));
      return;
    }
    await git.branch({ fs, dir, ref: branchName, checkout: true });
    console.log(`Switched to new branch '${branchName}'`);
    return;
  }

  if (cmd === 'checkout') {
    const branchName = args[0];
    await git.checkout({ fs, dir, ref: branchName });
    console.log(`Switched to branch '${branchName}'`);
    return;
  }

  if (cmd === 'add') {
    const file = args[0] || '.';
    if (file === '.') {
      const matrix = await git.statusMatrix({ fs, dir });
      for (const [filepath, head, workdir, stage] of matrix) {
        if (filepath.startsWith('node_modules') || filepath.startsWith('.git')) continue;
        if (workdir === 0) {
          await git.remove({ fs, dir, filepath });
        } else {
          await git.add({ fs, dir, filepath });
        }
      }
      console.log('Staged all modified and new files.');
    } else {
      await git.add({ fs, dir, filepath: file });
      console.log(`Staged ${file}`);
    }
    return;
  }

  if (cmd === 'commit') {
    const message = args.join(' ') || 'Update';
    const sha = await git.commit({
      fs,
      dir,
      message,
      author: {
        name: 'kavyanshitaneja-png',
        email: 'kavyanshi.taneja@gmail.com',
      },
    });
    console.log(`[${sha.slice(0, 7)}] ${message}`);
    return;
  }

  if (cmd === 'pull') {
    await git.pull({
      fs,
      http,
      dir,
      ref: 'main',
      singleBranch: true,
      author: {
        name: 'kavyanshitaneja-png',
        email: 'kavyanshi.taneja@gmail.com',
      },
    });
    console.log('Successfully pulled latest changes from origin/main.');
    return;
  }

  console.log(`Unknown command: ${cmd}`);
  console.log('Available: status, branch <name>, checkout <name>, add <file|.>, commit <message>, pull');
}

run().catch((err) => {
  console.error('Git error:', err.message || err);
});
