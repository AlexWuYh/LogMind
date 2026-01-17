from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting User Management Test...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            # Login as Admin
            print("1. Logging in as Admin...")
            page.goto("http://localhost:3000/login")
            page.fill("input[name='email']", "alex@example.com")
            page.fill("input[name='password']", "password123")
            page.click("button[type='submit']")
            page.wait_for_url("http://localhost:3000/")
            print("   ✅ Login Successful")

            # Navigate to User Management
            print("\n2. Navigating to User Management...")
            page.goto("http://localhost:3000/settings/users")
            page.wait_for_load_state("networkidle")
            
            if page.is_visible("text=用户管理"):
                print("   ✅ User Management Page Loaded")
            else:
                print("   ❌ User Management Page Failed")
                return

            # Create User
            test_email = f"test_user_{int(time.time())}@example.com"
            print(f"\n3. Creating User: {test_email}")
            page.click("button:has-text('添加用户')")
            page.fill("input[name='name']", "Test User")
            page.fill("input[name='email']", test_email)
            page.fill("input[name='password']", "password123")
            # Select role - this might be tricky with shadcn select, usually requires clicking trigger then option
            # Assuming default is USER, which is fine.
            page.click("button:has-text('创建用户')")
            
            # Wait for success
            try:
                page.wait_for_selector("text=成功", timeout=5000)
                print("   ✅ User Created")
            except:
                print("   ❌ Create Failed (No Toast)")

            # Search
            print("\n4. Searching User...")
            page.fill("input[placeholder*='搜索']", test_email)
            time.sleep(1) # Wait for debounce
            if page.is_visible(f"text={test_email}"):
                print("   ✅ Search Successful")
            else:
                print("   ❌ Search Failed")

            # Edit User
            print("\n5. Editing User...")
            # Click the dropdown menu trigger for the row
            # Locate row by text
            row = page.locator(f"tr:has-text('{test_email}')")
            row.locator("button").click() # Click menu trigger
            page.click("text=编辑")
            
            page.fill("input[name='name']", "Updated User")
            page.click("button:has-text('保存修改')")
            
            try:
                page.wait_for_selector("text=成功", timeout=5000)
                print("   ✅ User Updated")
            except:
                print("   ❌ Update Failed")
            
            # Verify update
            page.reload()
            page.fill("input[placeholder*='搜索']", test_email)
            time.sleep(1)
            if page.is_visible("text=Updated User"):
                print("   ✅ Update Verified in List")
            else:
                print("   ❌ Update Verification Failed")

            # Status Change
            print("\n6. Changing Status...")
            row = page.locator(f"tr:has-text('{test_email}')")
            row.locator("button").click()
            page.click("text=禁用账号")
            
            try:
                page.wait_for_selector("text=成功", timeout=5000)
                print("   ✅ Status Changed (Disabled)")
            except:
                print("   ❌ Status Change Failed")
            
            # Verify status badge
            if page.is_visible("text=已禁用"):
                print("   ✅ Status Badge Verified")

            # Delete User
            print("\n7. Deleting User...")
            row = page.locator(f"tr:has-text('{test_email}')")
            row.locator("button").click()
            page.click("text=删除账号")
            
            # Confirm dialog
            page.click("button:has-text('确认删除')")
            
            try:
                page.wait_for_selector("text=成功", timeout=5000)
                print("   ✅ User Deleted")
            except:
                print("   ❌ Delete Failed")

            # Verify removal
            time.sleep(1)
            if not page.is_visible(f"text={test_email}"):
                print("   ✅ Removal Verified")
            else:
                print("   ❌ User still visible in list")

        except Exception as e:
            print(f"❌ Test Failed: {e}")
            page.screenshot(path="user_mgmt_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
