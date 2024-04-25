#!/usr/bin/perl

use strict;
use lib '/srv/www/perl-lib';
use Lingua::BO::Wylie;
use Encode ();

use CGI ();
$CGI::POST_MAX = 1024 * 1024;	# max 1MB posts
$CGI::DISABLE_UPLOADS = 1;  	# no uploads

binmode(STDOUT, ":utf8");

my $conv = CGI::param('conversion') || "wy2uni";

my $input = CGI::param("input");
$input = '' unless defined $input;
$input = Encode::decode_utf8($input);

my $show = $input;
if ($show eq '' && $conv eq 'wy2uni') {
  $show = "oM aHhU~M` badz+ra gu ru pad+ma sid+d+hi hU~M`:";
}

# perl-generate the selects so we can keep the values on page reload
my %selects = (
  tib_font	=> [
	"Noto Serif Tibetan",
	"Jomolhari",
  	"Tibetan Machine Uni",
	"Kailasa",
	"Microsoft Himalaya",
  ],
  tib_size	=> [
	"18px",
	"20px",
	"24px",
	"28px",
	"32px",
	"36px",
	"40px",
	"44px",
	"48px",
	"52px",
  ],
  conversion	=> [
  	[ "wy2uni",	"Wylie to Unicode" ],
	[ "uni2wy", 	"Unicode to Wylie" ],
  ],
);

unless (CGI::param('tib_size')) {
  CGI::param(tib_size => "28px");
}

sub make_options {
  my $name = shift;
  my @out;
  my $opts = $selects{$name};
  foreach my $opt (@$opts) {
    my ($value, $label);
    if (ref($opt)) {
      ($value, $label) = @$opt;
    } else {
      $value = $label = $opt;
    }
    my $sel = ((CGI::param($name) || '') eq $value) ? 'selected' : '';
    push @out, qq{<option $sel value="$value">$label</option>\n};
  }
  return join '', @out;
}

my %html_options = map { $_ => make_options($_) } keys %selects;
my $leave_dubious = (CGI::param('dubious') eq 'leave');

$input =~ s/(?:\r|\n)*$//;

my $wl = new Lingua::BO::Wylie(
  check_strict	 => 1,
  print_warnings => 0,
  leave_dubious	 => $leave_dubious,
);

my $out = '';
my $warns;

if ($input ne '') {
  $out = $conv eq 'wy2uni' ? $wl->from_wylie($input) : $wl->to_wylie($input);
  $warns = $wl->get_warnings();
}

# plain text output?
if (CGI::param('plain')) {
  print CGI::header(-charset => "utf-8", -type => "text/plain");
  print $out;
  if ($warns && @$warns) {
    print "\n\n---\n";
    foreach my $w (@$warns) {
      print "$w\n";
    }
  }
  exit 0;
}

# HTML output
print CGI::header(-charset => "utf-8");
start_html();

sub start_html {
  print <<_HTML_;
<html>
<head>
<style>
.clearfix:before, .clearfix:after { content:""; display:table }
.clearfix:after { clear:both }

body { background: #fff }
body, td, input, select, textarea { font-family:verdana, tahoma, helvetica; font-size: 13px; }
.tib { font-family: "Tibetan Machine Uni"; font-size: 28px; }
.warn { font-family: tahoma; font-size: 13px; }
.eng { font-family: tahoma; font-size: 14px; }
.after { font-size: 13px; margin-top:5px }
.title { font-size: 18px; font-weight: bold; }
textarea#id__txt { margin-top: 5px; margin-bottom: 5px; padding: 5px; border: 1px solid blue; height: 120px; width: 100%; font-family: fixed; font-size: 14px; }
.head1 > div { line-height:24px }
.head1 > div.second { margin-top:5px }
input, select { border:1px solid #aaa; background:#fff; padding:6px; border-radius:2px; color:#333 }

\@media screen and (min-width:900px) {
	.head1 > div.first { float: left }
	.head1 > div.second { float: right; margin-top:0 }
}

</style>
<title>Tibetan transliteration: convert between Wylie and Unicode</title>
</head>
<body>
<div style="width:95%; max-width:900px; margin:0 auto">
<form id="id__form" method="POST">
<span class="title">Tibetan transliteration: convert between Wylie and Unicode</span><br><br>

<div class="head1 clearfix">
	<div class="first">
		Paste your Tibetan text below, and click "Convert" or press Ctrl+Enter.
	</div>
	<div class="second">
		Tibetan Font:
		<select name="tib_font" id="id__tib_font" onchange="javascript:set_tib_font();">
		$html_options{tib_font}
		</select>
		<select name="tib_size" id="id__tib_size" onchange="javascript:set_tib_font();">
		$html_options{tib_size}
		</select>
	</div>
</div>

<textarea id="id__txt" style="font-size: 14px;" onkeydown="return textarea_keydown(event);" name="input">$show</textarea><br>

<div class="head1 clearfix">
	<div class="first">
		<select id="id__conversion" name="conversion" onchange="javascript:set_tib_font();">
		$html_options{conversion}
		</select>
		<input type="submit" name="send" value="Convert!" style="font-weight:bold">
	</div>
	<div class="second">
		Dubious syllables: <label><input type="radio" name="dubious" value="process"@{[ $leave_dubious ? '' : 'checked' ]}>Try to process</label> &nbsp; <label><input type="radio" name="dubious" value="leave" @{[ $leave_dubious ? 'checked' : '' ]} >Leave untranslated</label>
	</div>
</div>

</form>
<br>

_HTML_
}

if ($out ne '') {
  $out = CGI::escapeHTML($out);

  if ($conv eq 'wy2uni') {
    print <<_HTML_;
Converted text in Tibetan script:<br>
<textarea id="id__tib_out" style="border: 1px solid #888; background: #eef; padding: 8px; width: 100%; height: 250px; margin-top:5px" class="tib">$out</textarea>
<div class="after">
If the text does not render properly, you might need to upgrade your browser and/or install a Tibetan font such as <a target="_blank" href="https://fonts.google.com/noto/specimen/Noto+Serif+Tibetan">Noto Serif Tibetan</a> or <a target="_blank" href="https://collab.its.virginia.edu/wiki/tibetan-script/Jomolhari%20ID.html">Jomolhari</a>.
</div>
_HTML_
  } else {
    print <<_HTML_;
Converted text in Wylie transliteration:<br>
<textarea style="border: 1px solid #888; background: #eef; padding: 8px; width: 85%; height: 250px;" class="eng">$out</textarea><br>
_HTML_
  }
}

if ($warns && @$warns) {
  $warns = join "<br>\n", map { CGI::escapeHTML($_) } @$warns;
  print <<_HTML_;
<br>
Warnings:
<div style="border: 1px solid #888; background: #ffa; padding: 8px; width: 100%; box-sizing:border-box; margin-top:5px" class="warn">
$warns
</div>
_HTML_
}

finish();

sub finish {
  print <<_HTML_;
<div class="after" style="margin-top:32px; line-height:1.5">
&bull; This conversion code is Free Software; you can <a href="https://www.lotsawahouse.org/Static/Lingua-BO-Wylie-dev.zip">download the Perl module here</a>.
<br>&bull; See <a target="_blank" href="https://github.com/buda-base/ewts-converter">here for a Java port</a> maintained by the BUDA project, and <a target="_blank" href="https://github.com/Esukhia/pyewts">here for a Python port</a> by Esukhia.

<br>
&bull; See the definition of <a target="_blank" href="http://www.thlib.org/reference/transliteration/#essay=/thl/ewts/ ">THL Extended Wylie Transliteration Schema</a>

</div>
<br><br>
<script>
function textarea_keydown(e) {
  // submit on control-Enter
  if (e && e.keyCode == 13 && e.ctrlKey) {
    document.getElementById('id__form').submit();
    return false;
  }
  return true;
}

function set_tib_font() {
  // read some drop-downs
  var e = document.getElementById('id__tib_font');
  var ft = e.options[e.selectedIndex].value;
  e = document.getElementById('id__tib_size');
  var fs = e.options[e.selectedIndex].value;
  e = document.getElementById('id__conversion');
  var conv = e.options[e.selectedIndex].value;

  e = document.getElementById('id__tib_out');
  if (e) {
    e.style.fontFamily = ft;
    e.style.fontSize = fs;
  }

  e = document.getElementById('id__txt');
  if (conv == 'wy2uni') {
    e.style.fontFamily = "verdana, tahoma, helvetica";
    e.style.fontSize = "14px"
  } else {
    e.style.fontFamily = ft;
    e.style.fontSize = fs;
  }
}

document.getElementById('id__txt').select();
document.getElementById('id__txt').focus();
set_tib_font();

</script>

</div>
</body>
</html>
_HTML_
}

