module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_FOLDER_PATH } = process.env;

  try {
    // Exchange refresh token for a short-lived access token
    const tokenRes = await fetch('https://api.dropbox.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: DROPBOX_REFRESH_TOKEN,
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET,
      }),
    });
    const { access_token } = await tokenRes.json();

    // List files in the folder
    const listRes = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: DROPBOX_FOLDER_PATH || '', recursive: false }),
    });
    const { entries } = await listRes.json();

    const imageEntries = entries.filter(e =>
      e['.tag'] === 'file' && /\.(jpe?g|png|gif|webp)$/i.test(e.name)
    );

    // Get a temporary direct link for each image
    const links = await Promise.all(
      imageEntries.map(async e => {
        const linkRes = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path: e.path_lower }),
        });
        const { link } = await linkRes.json();
        return link;
      })
    );

    res.status(200).json({ photos: links.filter(Boolean) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load photos' });
  }
}
