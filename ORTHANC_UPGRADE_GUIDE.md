# Orthanc Upgrade Guide - Add Plugin Support

## Why Upgrade?

Your current Orthanc can't decode echocardiograms because they use advanced compression (JPEG 2000, JPEG-LS, RLE). The **orthanc-plugins** image includes GDCM which supports ALL DICOM formats.

## What's Preserved?

✅ **All your data** - Stored in Docker volumes (not deleted)
✅ **All uploaded studies** - Remain intact
✅ **Database** - Preserved
✅ **Configuration** - Backed up automatically

## What Changes?

✅ **Adds GDCM plugin** - Decodes all DICOM formats
✅ **Adds Web Viewer** - Better built-in viewer
✅ **Adds DICOMweb** - Modern DICOM protocol
✅ **Same ports** - 8042 (HTTP), 4242 (DICOM)
✅ **Same credentials** - orthanc/orthanc

## How to Upgrade

### On Windows:

```bash
cd server
upgrade-orthanc-with-plugins.bat
```

### On Linux/Mac:

```bash
cd server
chmod +x upgrade-orthanc-with-plugins.sh
./upgrade-orthanc-with-plugins.sh
```

## What the Script Does:

1. ✅ **Backs up** your current data
2. ✅ **Saves** your configuration
3. ✅ **Stops** old container (keeps data)
4. ✅ **Starts** new container with plugins
5. ✅ **Verifies** everything works

## After Upgrade:

1. **Check Orthanc**: http://localhost:8042
2. **Login**: orthanc / orthanc
3. **Verify**: Your old studies are still there
4. **Upload**: Try the echocardiogram - it will work!

## Rollback (If Needed):

If something goes wrong:

```bash
# Stop new container
docker stop orthanc
docker rm orthanc

# Restore from backup
docker run -d --name orthanc -p 8042:8042 -p 4242:4242 jodogne/orthanc:latest
docker cp orthanc-backup-*.tar.gz orthanc:/tmp/
docker exec orthanc tar xzf /tmp/orthanc-backup-*.tar.gz -C /
docker restart orthanc
```

## Verification Checklist:

After upgrade, verify:

- [ ] Orthanc web UI loads (http://localhost:8042)
- [ ] Can login with orthanc/orthanc
- [ ] Old studies are visible
- [ ] Can upload new studies
- [ ] Echocardiogram uploads successfully
- [ ] Your app can connect to Orthanc

## New Plugins Included:

1. **GDCM** - Decodes all DICOM formats
2. **Web Viewer** - Built-in image viewer
3. **DICOMweb** - Modern DICOM protocol
4. **PostgreSQL** - Optional database upgrade
5. **Worklists** - Modality worklist support

## Technical Details:

### Old Container:
```
Image: jodogne/orthanc:latest
Plugins: None
Supported formats: Basic DICOM only
```

### New Container:
```
Image: jodogne/orthanc-plugins:latest
Plugins: GDCM, Web Viewer, DICOMweb
Supported formats: ALL DICOM formats
```

### Data Location:
```
Docker Volume: orthanc-storage
Path: /var/lib/orthanc/db
Status: Preserved during upgrade
```

## Troubleshooting:

### If upgrade fails:

1. **Check Docker is running**
   ```bash
   docker ps
   ```

2. **Check old Orthanc is stopped**
   ```bash
   docker stop orthanc
   ```

3. **Check port is free**
   ```bash
   netstat -an | grep 8042
   ```

4. **Try manual upgrade**
   ```bash
   docker stop orthanc
   docker rm orthanc
   docker run -d --name orthanc -p 8042:8042 -p 4242:4242 \
     -v orthanc-storage:/var/lib/orthanc/db \
     jodogne/orthanc-plugins:latest
   ```

### If data is missing:

1. **Check volume exists**
   ```bash
   docker volume ls | grep orthanc
   ```

2. **Restore from backup**
   ```bash
   docker cp orthanc-backup-*.tar.gz orthanc:/tmp/
   docker exec orthanc tar xzf /tmp/orthanc-backup-*.tar.gz -C /
   ```

## Support:

If you encounter issues:
1. Check the backup files were created
2. Verify Docker is running
3. Check Orthanc logs: `docker logs orthanc`
4. Restore from backup if needed

## Summary:

✅ **Safe** - Data is backed up
✅ **Quick** - Takes ~30 seconds
✅ **Reversible** - Can rollback anytime
✅ **Non-breaking** - Same ports, same credentials
✅ **Beneficial** - Supports ALL DICOM formats

**Ready to upgrade? Run the script!** 🚀
