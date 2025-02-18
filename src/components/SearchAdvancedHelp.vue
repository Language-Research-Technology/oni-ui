<script setup lang="ts">
</script>

<template>
  <el-row>
    <p>
      By default, queries in Advanced Search are applied to all fields, however, this can be refined using the <i>All
        Fields</i> dropdown menu on the left. To search in more than one field, select <i>Add New Line</i> and specify
      the additional field you wish to search. To reset your search query, select <i>Clear</i>.
      The information entered in the Advanced Search text field is treated as part of a 'mini-language':
    </p>
    <p>
      - Your query specifications across multiple lines will be compiled as a single query string consisting of a series
      of search terms and operators which can be viewed by clicking the <i>Show Query</i> button.
    </p>
    <p>
      - In general, the search text is not case-sensitive. Exceptions to this are Boolean operators (see below).<br />
    </p>
  </el-row>

  <el-row>
    <p class="py-2 font-bold">Boolean Operators</p>
  </el-row>

  <el-row>
    <p>
      The standard Boolean operators <code class="literal backdrop-blur">AND</code>, <code
        class="literal backdrop-blur">OR</code>
      and <code class="literal backdrop-blur">NOT</code> are supported in Advanced Search. These can either be added in
      the dropdown menu between fields when <i>Add New Line</i> is selected, or included within the search text field,
      using parentheses around the full query, e.g. <code class="literal backdrop-blur">(koala AND kangaroo)</code>.
    </p>
  </el-row>

  <el-row>
    <p>
      For instance, to search for items that contain both 'rainbow' and 'lorikeet' or 'pink' and 'cockatoo' but not
      'galah', the query should be:
    </p>
  </el-row>

  <el-row>
    <p>
      <code class="literal backdrop-blur">(((rainbow AND lorikeet) OR (pink AND cockatoo)) NOT galah)</code>
    </p>
  </el-row>

  <el-row>
    <p>
      To search for the literal words AND, OR and NOT, add a backward slash (<code
        class="literal backdrop-blur">\</code>)
      before that word to 'escape' it, e.g. <code class="literal backdrop-blur">\OR</code>. Note that this is a
      situation
      where the search text is case-sensitive; 'and' does not need to be escaped, but 'AND' does. Escaping will not
      return
      case-sensitive matches; it will just prevent its use as a Boolean operator.
    </p>
  </el-row>

  <el-row>
    <p class="py-2 font-bold">Query String Syntax</p>
    <table class="table-auto w-full">
      <thead class="bg-gray-50 text-xs text-gray-700 uppercase">
        <tr>
          <th>Symbol</th>
          <th>Function</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>" "</code></td>
          <td>Use double quotation marks before and after a phrase to search for that exact phrase, e.g. <code
              class="literal backdrop-blur">"public house"</code>. Entries where a hyphen occurs in the text instead of
            a
            space will also be returned in a phrasal search.
          </td>
        </tr>
        <tr>
          <td><code>~</code></td>
          <td>Creates a fuzzy query to return results similar to the search term by changing, removing, inserting or
            transposing one or more characters. Add a number following this operator to increase the number of
            variations,
            e.g. <code class="literal backdrop-blur">brwn~2</code> will find instances of 'brown', 'been', 'own', etc.
            Fuzzy queries can also be applied to phrasal searches, allowing the specified words to be further apart or
            in
            a different order, e.g. <code class="literal backdrop-blur">"house home"~3</code> will find instances of
            'house and home', 'house is my home', 'home, the house', etc.
          </td>
        </tr>
        <tr class="bg-gray-50">
          <td><code>?</code></td>
          <td>Wildcard to replace a single character. Wildcards cannot be included in a phrasal search. e.g. <code
              class="literal backdrop-blur">qu?ck</code> will find instances of 'quick' and 'quack'.
          </td>
        </tr>
        <tr>
          <td><code>*</code></td>
          <td>Wildcard to replace zero or more characters. Wildcards cannot be included in a phrasal search. e.g. <code
              class="literal backdrop-blur">gre*</code> will find instances of 'green', 'grew', 'greater', etc. This
            wildcard can also be used to find related word forms e.g. <code>ask*</code> will find instances of 'ask',
            'asks', 'asked' and 'asking'.
          </td>
        </tr>
        <tr>
          <td><code>( )</code></td>
          <td>Defines a sub-expression.</td>
        </tr>
      </tbody>
    </table>
  </el-row>

  <el-row>
    <p class="py-2 font-bold">
      Regular Expressions
    </p>
  </el-row>

  <el-row>
    <p>
      Some regular expression patterns can be used within the query string by surrounding the pattern in forward
      slashes,
      e.g. <code class="literal backdrop-blur">/gr[ae]y/</code> or <code class="literal backdrop-blur">/honou*r/</code>.
      Currently, regular expressions can only be used for complete word searches and not for partial words or phrases.
      This search function does not
      support full Perl-compatible regex syntax. For more information see:
      <a class="underline" title="RegExp Syntax"
        href="https://www.elastic.co/guide/en/elasticsearch/reference/current/regexp-syntax.html">
        RegExp Syntax</a>.
    </p>
  </el-row>

  <el-row>
    <p class="py-2 font-bold">
      Reserved Characters
    </p>
  </el-row>

  <el-row>
    <p class="py-2">
      <br />
      The following are reserved characters (i.e. part of the 'mini-language') that can have specific search functions
      and may need 'escaping' with \ if you want to search for the literal characters.
      <br />
      <code>
        &plus;&#x20;&minus;&#x20;&equals;&#x20;&amp;&amp;&#x20;&semi;&#x20;&vert;&vert;&#x20;&gt;&#x20;&lt;&#x20;&excl;&#x20;&lpar;&#x20;&rpar;&#x20;&lcub;&#x20;&rcub;&#x20;&lsqb;&#x20;&rsqb;&#x20;&Hat;&#x20;&quot;&#x20;&#x7E;&#x20;&ast;&#x20;&quest;&#x20;&colon;&#x20;&bsol;&#x20;&sol;
      </code>
    </p>
  </el-row>

  <el-row>
    <p class="py-2 font-bold">
      Show Query
    </p>
    <p class="py-2">
      If you need to check your search query against what it actually sent to the back-end search engine, select Show
      Query.
      For example, setting the search field to Language and searching for Danish has the following query string:
      <code>
        ( language.name.@value: Danish )
      </code>
    </p>
  </el-row>

  <!--
  <li class="px-3 py-1">A term can be a single word -- 'quick' or 'brown' -- or a phrase, surrounded by double
    quotes -- "quick brown" -- which searches for all the words in the phrase, in the same order. NB: In the
    Basic Search box, multi-word expressions are treated as being linked by OR regardless of whether they have
    quote marks around them.
  </li>
  <li class="px-3 py-1">Wildcard searches can be run on terms consisting of a single word, using ? to replace a
    single character, and * to replace zero or more characters. Wildcards cannot be included in a phrase search.
  </li>
  <li class="px-3 py-1">Regular expression patterns can be embedded in the query string by wrapping them in
    forward-slashes ("/"). This search engine does not support full Perl-compatible regex syntax, for more see:
    <a target="_blank" rel="noopener noreferrer" class="underline text-blue-300" href="https://www.elastic.co/guide/en/elasticsearch/reference/current/regexp-syntax.html">RegExp Syntax</a>.
  </li>
  <li class="px-3 py-1">The reserved characters are: <code class="literal backdrop-blur">+ - = && || > &lt; ! (
    ) { } [ ] ^ " ~ * ? : \ /</code></li>
  <li class="px-3 py-1">Reserved characters should be escaped using a back-slash ("\"). Failing to escape these
    special characters correctly could lead to a syntax error which prevents your query from running. For
    example, to search for 'LGBTQ+', you would need to enter the string 'LGBTQ\+'.
  </li>
  <li class="px-3 py-1">The familiar boolean operators AND, OR and NOT (also written &&, || and !) are also-->
  <!--            supported but beware that they do not honor the usual precedence rules, so parentheses should be used-->
  <!--            whenever multiple operators are used together. For instance, to search for files which contain both 'public'-->
  <!--            and 'house' or 'government' and 'house' or 'house' but not 'cottage', the query should be ((public AND-->
  <!--            house) OR (government AND house) OR house) AND NOT cottage-->
  <!--          </li>-->
  <!--          <li class="px-3 py-1">If you search for the literal word AND, OR, and NOT they all should be escaped. eg. \OR.-->
  <!--            Note that this is a situation where the search is case sensitive: 'and' does not need to be escaped, but-->
  <!--            'AND' does.-->
  <!--          </li>-->
  <!--          <li class="px-3 py-1">Clicking on "Use Query String" will show you the actual search string used for your search. You can update your search string however it will not convert back to the search box</li>-->
  <!--</ul>-->
</template>
