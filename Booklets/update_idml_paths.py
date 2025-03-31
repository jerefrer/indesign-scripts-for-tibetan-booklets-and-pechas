import os
import sys
import shutil
import zipfile
import tempfile

def update_version_in_idml(idml_path, old_version, new_version):
    """Update version strings in IDML file."""
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            # Extract IDML
            with zipfile.ZipFile(idml_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            changes_count = 0
            
            # Process all XML files
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    if file.endswith('.xml'):
                        file_path = os.path.join(root, file)
                        
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        # Replace version string everywhere in the file
                        new_content = content.replace(old_version, new_version)
                        
                        if new_content != content:
                            changes_count += new_content.count(new_version) - content.count(new_version)
                            with open(file_path, 'w', encoding='utf-8') as f:
                                f.write(new_content)
            
            # Create new IDML
            with zipfile.ZipFile(idml_path, 'w', compression=zipfile.ZIP_DEFLATED) as zip_ref:
                for root, _, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        archive_path = os.path.relpath(file_path, temp_dir)
                        zip_ref.write(file_path, archive_path)
            
            print(f"Updated {changes_count} instances")
            return True
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python update_idml_paths.py <idml_file> <old_version> <new_version>")
        sys.exit(1)
    
    update_version_in_idml(sys.argv[1], sys.argv[2], sys.argv[3])